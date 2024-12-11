

import {IAgentRuntime, Client, elizaLogger, Memory, stringToUuid, Content, UUID} from "@ai16z/eliza";
import express from "express";
import {createApiRouter} from "./api.ts";
import * as http from "node:http";
import axios from "axios";

class TheoriqManager {
    runtime: IAgentRuntime;
    router: express.Router;
    app: express.Application;
    server: http.Server;
    dataServiceUrl: string;
    roomId: UUID;

    constructor(runtime: IAgentRuntime) {
        this.dataServiceUrl = "http://localhost:8890";
        this.roomId = stringToUuid("my-room-123");
        this.runtime = runtime;
        this.router = createApiRouter();
        this.app = express();
        this.app.use(this.router);

        elizaLogger.log(`client started with roomId ${this.roomId}`);

        this.app.get("/tweets", async (req, res) => {
            const tweets = await this.getTweets();
            res.json(tweets);
        });

        this.app.get("/cookies", async (req, res) => {
            const tweets = await this.getCookieFun();
            res.json(tweets);
        });

        this.app.post("/tests/roomId", (req, res) => {
            const roomId = req.body.roomId;
            const result = stringToUuid(roomId);
            res.json(result);
        })
    }

    async getTweets(): Promise<any> {
        const response = await axios.get(`${this.dataServiceUrl}/twitter/tweets`);
        const tweets = response.data;
        await this.createMemory("here are the latest relevant tweets", tweets);
        return tweets;
    }

    async getCookieFun(): Promise<any> {
        const response = await axios.get(`${this.dataServiceUrl}/cookie/get-cookie`);
        const cookies = response.data;
        await this.createMemory("here are the latest relevant data from Cookie", cookies);
        return cookies;
    }

    async createMemory(message: string, data: any): Promise<any> {
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
            roomId: this.roomId,
            content: content,
            createdAt: Date.now(),
        }

        await this.runtime.messageManager.createMemory(memory);
    }

    public startExpress(serverPort: number) {
        this.server = this.app.listen(serverPort, () => {
            elizaLogger.info(`Server started at http://localhost:${serverPort}`);
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.log("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }
}

export const TheoriqClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        elizaLogger.success("Theoriq client started");
        const manager = new TheoriqManager(runtime);
        manager.startExpress(3001);
        return manager;
    },

    async stop(_runtime: IAgentRuntime, manager?: TheoriqManager) {
        elizaLogger.log("Theoriq client stopped");
        manager.stop()
    }
}

export default TheoriqClientInterface;
