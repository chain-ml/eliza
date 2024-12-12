

import {IAgentRuntime, Client, elizaLogger, stringToUuid, UUID} from "@ai16z/eliza";
import express from "express";
import {createApiRouter} from "./api.ts";
import * as http from "node:http";
import { AlphaDataSource } from "./alphaDataSource.ts";

class TheoriqManager {
    runtime: IAgentRuntime;
    datasource: AlphaDataSource;
    router: express.Router;
    app: express.Application;
    server: http.Server;
    // roomId: UUID;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.datasource = new AlphaDataSource(runtime);
        this.router = createApiRouter();
        this.app = express();
        this.app.use(this.router);


        elizaLogger.log(`theoriq client started`);

        this.app.get("/tweets", async (req, res) => {
            const roomId = stringToUuid(req.body.roomId as UUID);
            const tweets = await this.datasource.createMemoryForTweets(roomId);
            res.json(tweets);
        });

        this.app.get("/cookies", async (req, res) => {
            const roomId = stringToUuid(req.body.roomId);
            const tweets = await this.datasource.createMemoryForCookieFun(roomId);
            res.json(tweets);
        });

        this.app.post("/tests/roomId", (req, res) => {
            const roomId = req.body.roomId;
            const result = stringToUuid(roomId);
            // const result = roomId as UUID;
            res.json(result);
        })
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

// export default TheoriqClientInterface;
export * from "./alphaDataSource.ts"
