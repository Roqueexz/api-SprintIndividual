// Importa o Router do Express — é ele quem permite criar e organizar as rotas da aplicação
// Request e Response são os tipos TypeScript que representam a requisição e a resposta HTTP
import { Router, type Request, type Response } from "express";

// Importa os controllers — cada um é responsável por tratar as requisições de sua entidade
import CategoriaController from "./controller/CategoriaController.js";
import ProdutoController from "./controller/ProdutoController.js";
import MovimentacaoController from "./controller/MovimentacaoController.js";

// Cria uma instância do Router
// É neste objeto que todas as rotas da aplicação serão registradas
const router = Router();


// ==================== HEALTH CHECK ====================

// Rota GET na raiz "/" — usada para verificar se a API está no ar
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        mensagem: "Aplicação online.",
        timestamp: new Date()
    });
});


// ============================================================
// ==================== CATEGORIA =============================
// ============================================================

// Lista todas as categorias cadastradas
router.get(
    '/api/categorias',
    CategoriaController.todos
);

// Busca uma categoria específica pelo ID
// Ex: GET /api/categorias/3
router.get(
    '/api/categorias/:id',
    CategoriaController.categoria
);

// Cadastra uma nova categoria
router.post(
    '/api/categorias',
    CategoriaController.cadastrar
);

// Remove uma categoria pelo ID
router.delete(
    '/api/categorias/:id',
    CategoriaController.remover
);

// Atualiza os dados de uma categoria
router.put(
    '/api/categorias/:id',
    CategoriaController.atualizar
);


// ============================================================
// ====================== PRODUTO ==============================
// ============================================================

// Lista todos os produtos cadastrados
router.get(
    '/api/produtos',
    ProdutoController.todos
);

// Busca um produto específico pelo ID
// Ex: GET /api/produtos/5
router.get(
    '/api/produtos/:id',
    ProdutoController.produto
);

// Cadastra um novo produto
router.post(
    '/api/produtos',
    ProdutoController.cadastrar
);

// Remove um produto pelo ID
router.delete(
    '/api/produtos/:id',
    ProdutoController.remover
);

// Atualiza os dados de um produto
router.put(
    '/api/produtos/:id',
    ProdutoController.atualizar
);


// ============================================================
// =================== MOVIMENTAÇÃO ============================
// ============================================================

// Lista todas as movimentações cadastradas
router.get(
    '/api/movimentacoes',
    MovimentacaoController.todos
);

// Busca uma movimentação específica pelo ID
// Ex: GET /api/movimentacoes/10
router.get(
    '/api/movimentacoes/:id',
    MovimentacaoController.movimentacao
);

// Registra uma nova movimentação
router.post(
    '/api/movimentacoes',
    MovimentacaoController.cadastrar
);


// ============================================================
// ======================== EXPORT =============================
// ============================================================

// Exporta o router para ser registrado no server.ts
export { router };