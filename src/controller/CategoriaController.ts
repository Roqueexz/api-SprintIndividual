// Importa a classe Categoria do model — é daqui que vêm os métodos de acesso ao banco de dados
import Categoria from "../model/Categoria.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
import { type Request, type Response } from "express";

// Importa o tipo CategoriaDTO para tipar os dados recebidos do front-end no body das requisições
import type CategoriaDTO from "../interface/CategoriaDTO.js";

// Define a classe CategoriaController que HERDA da classe Categoria (extends)
// A arquitetura MVC separa responsabilidades:
//   - Model (Categoria): cuida da comunicação com o banco de dados
//   - Controller (CategoriaController): cuida das requisições HTTP e respostas
class CategoriaController extends Categoria {

    /**
     * Lista todas as categorias cadastradas no sistema.
     * Retorna 204 se não houver categorias, 200 com a lista caso contrário.
     *
     * @param req Objeto de requisição HTTP.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de CategoriaDTO | 204 sem conteúdo | 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {

            // Chama o método do model que busca todas as categorias
            const listaDeCategorias = await Categoria.listarCategorias();

            // Se o array estiver vazio, não há categorias cadastradas
            if (listaDeCategorias.length === 0) {
                res.status(204).send();
                return;
            }

            // Retorna a lista de categorias com status 200
            res.status(200).json(listaDeCategorias);

        } catch (error) {

            console.error(
                `[CategoriaController] Erro ao listar categorias:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao recuperar a lista de categorias."
            });
        }
    }

    /**
     * Busca e retorna uma categoria específica pelo ID informado na URL.
     *
     * @param req Espera o parâmetro "id" na URL.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com CategoriaDTO | 400 se o ID for inválido |
     * 404 se não encontrada | 500 em caso de erro interno.
     */
    static async categoria(req: Request, res: Response) {
        try {

            // Lê o parâmetro "id" da URL e converte de string para número inteiro
            const idCategoria = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Busca a categoria no banco de dados
            const categoria = await Categoria.listarCategoria(idCategoria);

            // Retorna a categoria encontrada
            res.status(200).json(categoria);

        } catch (error: any) {

            console.error(
                `[CategoriaController] Erro ao buscar categoria (id: ${req.params.id}):`,
                error
            );

            // Diferencia categoria não encontrada de erro interno
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao recuperar a categoria."
            });
        }
    }

    /**
     * Cadastra uma nova categoria no sistema.
     *
     * @param req Espera no body o campo "nome".
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrada com sucesso | 400 se o nome estiver ausente |
     * 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {

            // Lê o corpo da requisição e tipifica como CategoriaDTO
            const dadosRecebidos: CategoriaDTO = req.body;

            // Valida se o nome foi enviado
            if (!dadosRecebidos.nome) {
                res.status(400).json({
                    mensagem: "Campo obrigatório ausente: nome."
                });
                return;
            }

            // Cria um novo objeto Categoria com o nome recebido
            const novaCategoria = new Categoria(
                dadosRecebidos.nome
            );

            // Persiste a categoria no banco de dados
            const result = await Categoria.cadastrarCategoria(
                novaCategoria
            );

            // Verifica se o cadastro foi realizado
            if (result) {

                res.status(201).json({
                    mensagem: "Categoria cadastrada com sucesso."
                });

            } else {

                res.status(400).json({
                    mensagem: "Não foi possível cadastrar a categoria."
                });
            }

        } catch (error) {

            console.error(
                `[CategoriaController] Erro ao cadastrar categoria:`,
                error
            );

            res.status(500).json({
                mensagem: "Erro interno ao cadastrar a categoria."
            });
        }
    }

    /**
     * Remove uma categoria pelo ID informado na URL.
     *
     * @param req Espera o parâmetro "id" na URL.
     * @param res Objeto de resposta HTTP.
     * @returns 200 se removida com sucesso | 400 se o ID for inválido |
     * 404 se não encontrada | 500 em caso de erro interno.
     */
    static async remover(req: Request, res: Response) {
        try {

            // Lê e converte o ID da URL para número inteiro
            const idCategoria = parseInt(req.params.id as string);

            // Valida o ID
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Chama o método do model responsável pela exclusão da categoria
            const result = await Categoria.removerCategoria(
                idCategoria
            );

            // Verifica se a categoria foi removida
            if (result) {

                res.status(200).json({
                    mensagem: "Categoria removida com sucesso."
                });

            } else {

                res.status(404).json({
                    mensagem: "Categoria não encontrada."
                });
            }

        } catch (error: any) {

            console.error(
                `[CategoriaController] Erro ao remover categoria (id: ${req.params.id}):`,
                error
            );

            // Categoria não encontrada
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao remover a categoria."
            });
        }
    }

    /**
     * Atualiza o nome de uma categoria existente.
     *
     * @param req Espera o parâmetro "id" na URL e o campo "nome" no body.
     * @param res Objeto de resposta HTTP.
     * @returns 200 se atualizada com sucesso | 400 se ID ou nome forem inválidos |
     * 404 se não encontrada | 500 em caso de erro interno.
     */
    static async atualizar(req: Request, res: Response) {
        try {

            // Lê e converte o ID da URL para número inteiro
            const idCategoria = parseInt(req.params.id as string);

            // Valida o ID
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Lê os dados enviados pelo front-end
            const dadosRecebidos: CategoriaDTO = req.body;

            // Valida o campo obrigatório
            if (!dadosRecebidos.nome) {
                res.status(400).json({
                    mensagem: "Campo obrigatório ausente: nome."
                });
                return;
            }

            // Cria um objeto Categoria com o novo nome
            const categoria = new Categoria(
                dadosRecebidos.nome
            );

            // Define o ID vindo da URL
            categoria.setIdCategoria(idCategoria);

            // Atualiza a categoria no banco de dados
            const result = await Categoria.atualizarCategoria(
                categoria
            );

            // Verifica se a atualização foi realizada
            if (result) {

                res.status(200).json({
                    mensagem: "Categoria atualizada com sucesso."
                });

            } else {

                res.status(404).json({
                    mensagem: "Categoria não encontrada."
                });
            }

        } catch (error: any) {

            console.error(
                `[CategoriaController] Erro ao atualizar categoria (id: ${req.params.id}):`,
                error
            );

            // Categoria não encontrada
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao atualizar a categoria."
            });
        }
    }
}

// Exporta o controller para ser utilizado no arquivo de rotas
export default CategoriaController;