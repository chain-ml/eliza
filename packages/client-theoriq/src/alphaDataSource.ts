import {Content, elizaLogger, IAgentRuntime, Memory, stringToUuid, UUID} from "@ai16z/eliza";
import axios from "axios";

export class AlphaDataSource {
    dataServiceUrl: string;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        // this.dataServiceUrl = "http://host.docker.internal:8890";
        this.dataServiceUrl = process.env.ELIZA_ALPHA_BOT_DATA_URL;
        if (!this.dataServiceUrl) {
            throw Error("ELIZA_ALPHA_BOT_DATA_URL not set")
        }

        elizaLogger.info("starting alphaDataSource with url: ", this.dataServiceUrl);
        this.runtime = runtime;
    }

    public async getMessageForTweets(): Promise<string | undefined> {
        const response = await axios.get(`${this.dataServiceUrl}/twitter/tweets`);
        if (response.status == 204) {
            return undefined
        }

        return this.formatData("here are the latest relevant tweets", response.data);
    }

    public async getMessageForCookieFun(): Promise<string | undefined> {
        const response = await axios.get(`${this.dataServiceUrl}/cookie/get-cookie`);
        if (response.status == 204) {
            return undefined
        }

        return this.formatData("here are the latest relevant projects", response.data);
    }

    public async getMessageForAll(): Promise<string | undefined> {
        const response = await axios.get(`${this.dataServiceUrl}/cookie/get-all`);
        if (response.status == 204) {
            return undefined
        }

        return this.formatData("here are the latest relevant projects and tweets", response.data);
    }

    public async getMessageForMock(): Promise<string | undefined> {
        const response = await axios.get(`${this.dataServiceUrl}/cookie/get-mock`);
        if (response.status == 204) {
            return undefined
        }

        return this.formatData("here are the latest relevant projects and tweets", response.data);
    }

    formatData(message: string, data: any): string {
        return `${message}: \n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\`\n`
    }

    async createMemory(roomId: UUID, text: string | undefined): Promise<any> {
        if (text === undefined) {
            return undefined;
        }

        const content: Content = {
            text: text,
            attachments: [],
            source: "twitter",
            inReplyTo: undefined,
        }
        const messageId = stringToUuid(Date.now().toString());
        const userId = stringToUuid("user");
        const memory : Memory = {
            id: messageId,
            agentId: this.runtime.agentId,
            userId: userId,
            roomId: roomId,
            content: content,
            createdAt: Date.now(),
        }

        await this.runtime.messageManager.createMemory(memory);
    }
}
