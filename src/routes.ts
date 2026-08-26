import { Router, type Request, type Response } from "express";
import CategoriaController from "./controller/CategoriaController.js";
import ProdutoController from "./controller/ProdutoController.js";
import MovimentacaoController from "./controller/MovimentacaoController.js";
import { Auth } from "./middlewares/Auth.js";

const router = Router();

// ==================== HEALTH CHECK ====================
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        mensagem: "InfoTech Estoque API Online",
        timestamp: new Date()
    });
});

// ==================== AUTHENTICATION ====================
router.post('/api/login', Auth.validacaoUsuario);

// ==================== DASHBOARD & RELATÓRIOS ====================
router.get('/api/dashboard', ProdutoController.dashboard);
router.get('/api/produtos/reposicao', ProdutoController.reposicao);

// ==================== CATEGORIAS ====================
router.get('/api/categorias', CategoriaController.todos);
router.get('/api/categorias/:id', CategoriaController.categoria);
router.post('/api/categorias', CategoriaController.cadastrar);
router.delete('/api/categorias/:id', CategoriaController.remover);
router.put('/api/categorias/:id', CategoriaController.atualizar);

// ==================== PRODUTOS ====================
router.get('/api/produtos', ProdutoController.todos);
router.get('/api/produtos/:id', ProdutoController.produto);
router.post('/api/produtos', ProdutoController.cadastrar);
router.delete('/api/produtos/:id', ProdutoController.remover);
router.put('/api/produtos/:id', ProdutoController.atualizar);

// ==================== MOVIMENTAÇÕES ====================
router.get('/api/movimentacoes', MovimentacaoController.todos);
router.get('/api/movimentacoes/:id', MovimentacaoController.movimentacao);
router.post('/api/movimentacoes', MovimentacaoController.cadastrar);

export { router };