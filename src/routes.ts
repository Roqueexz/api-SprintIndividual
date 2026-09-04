import { Router, type Request, type Response } from "express";
import CategoriaController from "./controller/CategoriaController.js";
import ProdutoController from "./controller/ProdutoController.js";
import MovimentacaoController from "./controller/MovimentacaoController.js";
import { UsuarioController } from "./controller/UsuarioController.js";
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

// ==================== USUÁRIOS (CRUD COMPLETO) ====================
router.post('/api/usuarios/cadastrar', UsuarioController.cadastrar);       // Público — registro
router.post('/api/usuarios', UsuarioController.cadastrar);                 // Rota padrão REST
router.get('/api/usuarios', UsuarioController.todos);                      // Listagem geral
router.get('/api/usuarios/:id', UsuarioController.usuario);                // Buscar por ID
router.put('/api/usuarios/:id', UsuarioController.atualizar);              // Atualização total
router.patch('/api/usuarios/:id', UsuarioController.atualizarParcial);     // Atualização parcial (PATCH)
router.delete('/api/usuarios/:id', UsuarioController.remover);             // Exclusão (DELETE)

// ==================== DASHBOARD & RELATÓRIOS ====================
router.get('/api/dashboard', ProdutoController.dashboard);
router.get('/api/produtos/reposicao', ProdutoController.reposicao);

// ==================== CATEGORIAS (CRUD COMPLETO) ====================
router.get('/api/categorias', CategoriaController.todos);
router.get('/api/categorias/:id', CategoriaController.categoria);
router.post('/api/categorias', CategoriaController.cadastrar);
router.put('/api/categorias/:id', CategoriaController.atualizar);
router.patch('/api/categorias/:id', CategoriaController.atualizarParcial); // Atualização parcial (PATCH)
router.delete('/api/categorias/:id', CategoriaController.remover);         // Exclusão (DELETE)

// ==================== PRODUTOS (CRUD COMPLETO) ====================
router.get('/api/produtos', ProdutoController.todos);
router.get('/api/produtos/:id', ProdutoController.produto);
router.post('/api/produtos', ProdutoController.cadastrar);
router.put('/api/produtos/:id', ProdutoController.atualizar);
router.patch('/api/produtos/:id/status', ProdutoController.alternarStatus); // Alternar ativo/inativo (PATCH)
router.patch('/api/produtos/:id', ProdutoController.atualizarParcial);      // Atualização parcial (PATCH)
router.delete('/api/produtos/:id', ProdutoController.remover);              // Exclusão / Desativação (DELETE)

// ==================== MOVIMENTAÇÕES (CRUD AUDITÁVEL) ====================
router.get('/api/movimentacoes', MovimentacaoController.todos);
router.get('/api/movimentacoes/:id', MovimentacaoController.movimentacao);
router.post('/api/movimentacoes', MovimentacaoController.cadastrar);
router.patch('/api/movimentacoes/:id', MovimentacaoController.atualizarParcial); // Retificar observação (PATCH)
router.delete('/api/movimentacoes/:id', MovimentacaoController.remover);         // Estorno seguro com correção (DELETE)

export { router };