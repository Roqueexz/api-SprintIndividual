import { Router } from 'express'; // Import the Router class from the express module
import type { Request, Response } from 'express'; // Import types for Request and Response

const router = Router(); // Create a new router instance

router.get("/api", (req: Request, res: Response) => {  
    res.status(200).json({ mensagem: "Olá, seja bem-vindo à API!" });
});

export { router }; // Export the router instance