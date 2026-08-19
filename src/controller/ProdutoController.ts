// Importa a classe Produto do model — é daqui que vêm os métodos de acesso ao banco de dados
import Produto from "../model/Produto.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
import { type Request, type Response } from "express";

// Importa o tipo ProdutoDTO para tipar os dados recebidos do front-end no body das requisições
import type ProdutoDTO from "../interface/ProdutoDTO.js";

// Define a classe ProdutoController que HERDA da classe Produto (extends)
// A herança permite que o controller acesse os métodos estáticos do model
class ProdutoController extends Produto {

    /**
     * Lista todos os produtos ativos cadastrados no sistema.
     * Retorna 204 se não houver produtos cadastrados, 200 com a lista caso contrário.
     *
     * @param req Objeto de requisição HTTP.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de ProdutoDTO | 204 sem conteúdo | 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {

            // Chama o método do model que busca todos os produtos ativos
            const listaDeProdutos = await Produto.listarProdutos();

            // Se o array estiver vazio, não há produtos cadastrados
            if (listaDeProdutos.length === 0) {
                res.status(204).send();
                return;
            }

            // Retorna a lista de produtos com status 200
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
     *
     * @param req Espera o parâmetro "id" na URL.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com ProdutoDTO | 400 se o ID for inválido |
     * 404 se não encontrado | 500 em caso de erro interno.
     */
    static async produto(req: Request, res: Response) {
        try {

            // Lê o parâmetro "id" da URL e converte para número inteiro
            const idProduto = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo
            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Busca o produto no banco
            const produto = await Produto.listarProduto(idProduto);

            // Retorna o produto encontrado
            res.status(200).json(produto);

        } catch (error: any) {

            console.error(
                `[ProdutoController] Erro ao buscar produto (id: ${req.params.id}):`,
                error
            );

            // Diferencia produto não encontrado de erro interno
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
     * Cadastra um novo produto no sistema com os dados recebidos
     * no corpo da requisição.
     *
     * @param req Espera no body:
     * id_categoria, codigo, nome, preco_unitario e quantidade_minima.
     * descricao é opcional.
     *
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrado com sucesso | 400 se campos obrigatórios
     * estiverem ausentes | 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {

            // Lê o corpo da requisição e tipifica como ProdutoDTO
            const dadosRecebidos: ProdutoDTO = req.body;

            // Valida os campos obrigatórios
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

            // Cria um novo objeto Produto com os dados recebidos
            const novoProduto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.descricao ?? "",
                dadosRecebidos.preco_unitario,
                dadosRecebidos.quantidade_minima
            );

            // Persiste o produto no banco de dados
            const result = await Produto.cadastrarProduto(novoProduto);

            // Verifica se o cadastro foi realizado
            if (result) {

                res.status(201).json({
                    mensagem: "Produto cadastrado com sucesso."
                });

            } else {

                res.status(400).json({
                    mensagem: "Não foi possível cadastrar o produto."
                });
            }

        } catch (error) {

            console.error(
                `[ProdutoController] Erro ao cadastrar produto:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao cadastrar o produto."
            });
        }
    }

    /**
     * Remove logicamente um produto do sistema pelo ID informado na URL.
     * O registro não é apagado do banco — apenas fica com ativo = FALSE.
     *
     * @param req Espera o parâmetro "id" na URL.
     * @param res Objeto de resposta HTTP.
     * @returns 200 se removido com sucesso | 400 se ID inválido |
     * 404 se não encontrado ou já inativo | 500 em caso de erro interno.
     */
    static async remover(req: Request, res: Response) {
        try {

            // Lê e converte o ID da URL para número inteiro
            const idProduto = parseInt(req.params.id as string);

            // Valida o ID
            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Chama o método do model responsável pela remoção lógica
            const result = await Produto.removerProduto(idProduto);

            // Verifica se o produto foi desativado
            if (result) {

                res.status(200).json({
                    mensagem: "Produto removido com sucesso."
                });

            } else {

                res.status(404).json({
                    mensagem: "Produto não encontrado ou já está inativo."
                });
            }

        } catch (error: any) {

            console.error(
                `[ProdutoController] Erro ao remover produto (id: ${req.params.id}):`,
                error
            );

            // Produto não encontrado
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
     * A quantidade_disponivel NÃO é alterada aqui.
     * Alterações no estoque devem ocorrer através de movimentações.
     *
     * @param req Espera o parâmetro "id" na URL e no body:
     * id_categoria, codigo, nome, preco_unitario e quantidade_minima.
     * descricao é opcional.
     *
     * @param res Objeto de resposta HTTP.
     * @returns 200 se atualizado com sucesso | 400 se ID ou campos
     * forem inválidos | 404 se não encontrado ou inativo |
     * 500 em caso de erro interno.
     */
    static async atualizar(req: Request, res: Response) {
        try {

            // Lê e converte o ID da URL para número inteiro
            const idProduto = parseInt(req.params.id as string);

            // Valida o ID
            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Lê os dados enviados pelo front-end
            const dadosRecebidos: ProdutoDTO = req.body;

            // Valida os campos obrigatórios
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

            // Cria um objeto Produto com os novos dados
            const produto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.descricao ?? "",
                dadosRecebidos.preco_unitario,
                dadosRecebidos.quantidade_minima
            );

            // Define o ID vindo da URL
            produto.setIdProduto(idProduto);

            // Atualiza o produto no banco
            const result = await Produto.atualizarProduto(produto);

            // Verifica se a atualização foi realizada
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

            // Produto não encontrado
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
}

// Exporta o controller para ser utilizado nas rotas
export default ProdutoController;