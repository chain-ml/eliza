import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

export function createApiRouter() {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/test", (req, res) => {
        res.json({message: "test"})
    });

    return router;
}
