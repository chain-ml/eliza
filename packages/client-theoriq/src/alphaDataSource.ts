import {Content, IAgentRuntime, Memory, stringToUuid, UUID} from "@ai16z/eliza";
import axios from "axios";

export class AlphaDataSource {
    dataServiceUrl: string;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.dataServiceUrl = "http://localhost:8890";
        this.runtime = runtime;
    }

    public async createMemoryForTweets(roomId: UUID): Promise<any> {
        const response = await axios.get(`${this.dataServiceUrl}/twitter/tweets`);
        const tweets = response.data;
        await this.createMemory(roomId, "here are the latest relevant tweets", tweets);
        return tweets;
    }

    public async createMemoryForCookieFun(roomId: UUID): Promise<any> {
        const response = await axios.get(`${this.dataServiceUrl}/cookie/get-cookie`);
        const cookies = response.data;
        await this.createMemory(roomId, "here are the latest relevant data from Cookie", cookies);
        return cookies;
    }

    async createMemory(roomId: UUID, message: string, data: any): Promise<any> {
        const content: Content = {
            text: `${message}: \n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\`\n`,
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
