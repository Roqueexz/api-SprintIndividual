import Produto from "../model/Produto.js";
import { type Request, type Response } from "express";
import type ProdutoDTO from "../interface/ProdutoDTO.js";

class ProdutoController extends Produto {

    /**
     * Lista todos os produtos ativos cadastrados no sistema.
     */
    static async todos(req: Request, res: Response) {
        try {
            const incluirInativos = req.query.inativos === 'true' || req.query.incluirInativos === 'true';
            const listaDeProdutos = await Produto.listarProdutos(incluirInativos);

            if (listaDeProdutos.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeProdutos);

        } catch (error) {
            console.error(
                `[ProdutoController] Erro ao listar produtos:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao recuperar a lista de produtos."
            });
        }
    }

    /**
     * Busca e retorna os dados de um produto específico pelo ID informado na URL.
     */
    static async produto(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const produto = await Produto.listarProduto(idProduto);

            res.status(200).json(produto);

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao buscar produto (id: ${req.params.id}):`,
                error
            );

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao recuperar o produto."
            });
        }
    }

    /**
     * Lista produtos que necessitam de reposição (estoque <= mínimo).
     */
    static async reposicao(req: Request, res: Response) {
        try {
            const produtos = await Produto.listarProdutosReposicao();

            res.status(200).json(produtos);

        } catch (error) {
            console.error(
                `[ProdutoController] Erro ao listar produtos para reposição:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao recuperar produtos para reposição."
            });
        }
    }

    /**
     * Retorna indicadores e métricas financeiras do estoque para o Dashboard.
     */
    static async dashboard(req: Request, res: Response) {
        try {
            const metricas = await Produto.obterMetricasDashboard();

            res.status(200).json(metricas);

        } catch (error) {
            console.error(
                `[ProdutoController] Erro ao obter métricas do dashboard:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao recuperar métricas do dashboard."
            });
        }
    }

    /**
     * Cadastra um novo produto no sistema com os dados recebidos.
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined ||
                dadosRecebidos.quantidade_minima === undefined
            ) {
                res.status(400).json({
                    mensagem:
                        "Campos obrigatórios ausentes: id_categoria, codigo, nome, preco_unitario e quantidade_minima."
                });
                return;
            }

            const novoProduto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.descricao ?? "",
                dadosRecebidos.preco_unitario,
                dadosRecebidos.quantidade_minima
            );

            const result = await Produto.cadastrarProduto(novoProduto);

            if (result) {
                res.status(201).json({
                    mensagem: "Produto cadastrado com sucesso."
                });
            } else {
                res.status(400).json({
                    mensagem: "Não foi possível cadastrar o produto."
                });
            }

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao cadastrar produto:`,
                error
            );

            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                res.status(400).json({
                    mensagem: "Já existe um produto cadastrado com este código."
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao cadastrar o produto."
            });
        }
    }

    /**
     * Remove logicamente ou definitivamente um produto do sistema pelo ID informado na URL.
     */
    static async remover(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const result = await Produto.removerProduto(idProduto);

            if (result.removido) {
                const msg = result.tipo === 'desativado'
                    ? "Produto desativado com sucesso (mantido no histórico pois possui movimentações vinculadas)."
                    : "Produto excluído com sucesso.";
                res.status(200).json({
                    mensagem: msg,
                    tipo: result.tipo
                });
            } else {
                res.status(404).json({
                    mensagem: "Produto não encontrado."
                });
            }

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao remover produto (id: ${req.params.id}):`,
                error
            );

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao remover o produto."
            });
        }
    }

    /**
     * Atualiza os dados de um produto existente.
     */
    static async atualizar(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined ||
                dadosRecebidos.quantidade_minima === undefined
            ) {
                res.status(400).json({
                    mensagem:
                        "Campos obrigatórios ausentes: id_categoria, codigo, nome, preco_unitario e quantidade_minima."
                });
                return;
            }

            const produto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.descricao ?? "",
                dadosRecebidos.preco_unitario,
                dadosRecebidos.quantidade_minima
            );

            produto.setIdProduto(idProduto);

            const result = await Produto.atualizarProduto(produto);

            if (result) {
                res.status(200).json({
                    mensagem: "Produto atualizado com sucesso."
                });
            } else {
                res.status(404).json({
                    mensagem: "Produto não encontrado ou já está inativo."
                });
            }

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao atualizar produto (id: ${req.params.id}):`,
                error
            );

            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                res.status(400).json({
                    mensagem: "Já existe um produto cadastrado com este código."
                });
                return;
            }

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao atualizar o produto."
            });
        }
    }

    /**
     * Atualiza parcialmente um produto existente (PATCH).
     */
    static async atualizarParcial(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const dadosRecebidos: Partial<ProdutoDTO> = req.body;

            const result = await Produto.atualizarParcialProduto(idProduto, dadosRecebidos);

            if (result) {
                res.status(200).json({
                    mensagem: "Produto atualizado com sucesso."
                });
            } else {
                res.status(404).json({
                    mensagem: "Produto não encontrado."
                });
            }

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao atualizar parcialmente produto (id: ${req.params.id}):`,
                error
            );

            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                res.status(400).json({
                    mensagem: "Já existe um produto cadastrado com este código."
                });
                return;
            }

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao atualizar o produto."
            });
        }
    }

    /**
     * Alterna o status ativo/inativo de um produto (PATCH /status).
     */
    static async alternarStatus(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const { ativo } = req.body;

            if (typeof ativo !== 'boolean') {
                res.status(400).json({
                    mensagem: "Campo 'ativo' deve ser um booleano (true ou false)."
                });
                return;
            }

            const result = await Produto.atualizarParcialProduto(idProduto, { ativo });

            if (result) {
                res.status(200).json({
                    mensagem: ativo ? "Produto ativado com sucesso." : "Produto desativado com sucesso.",
                    ativo
                });
            } else {
                res.status(404).json({
                    mensagem: "Produto não encontrado."
                });
            }

        } catch (error: any) {
            console.error(
                `[ProdutoController] Erro ao alterar status do produto (id: ${req.params.id}):`,
                error
            );
            res.status(500).json({
                mensagem: "Erro interno ao alterar status do produto."
            });
        }
    }
}

export default ProdutoController;