// Importa a classe Movimentacao do model — é daqui que vêm os métodos de acesso ao banco de dados
import Movimentacao from "../model/Movimentacao.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
import { type Request, type Response } from "express";

// Importa o tipo MovimentacaoDTO para tipar os dados recebidos do front-end no body das requisições
import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";

// Define a classe MovimentacaoController que HERDA da classe Movimentacao
// A arquitetura MVC separa responsabilidades:
//   - Model (Movimentacao): cuida da comunicação com o banco de dados
//   - Controller (MovimentacaoController): cuida das requisições HTTP e respostas
class MovimentacaoController extends Movimentacao {

    /**
     * Lista todas as movimentações cadastradas no sistema.
     * As movimentações são registros históricos e não possuem exclusão lógica.
     *
     * @param req Objeto de requisição HTTP.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de MovimentacaoDTO | 204 sem conteúdo |
     * 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {

            // Chama o método do model que busca todas as movimentações
            const listaDeMovimentacoes =
                await Movimentacao.listarMovimentacoes();

            // Se o array estiver vazio, não há movimentações cadastradas
            if (listaDeMovimentacoes.length === 0) {
                res.status(204).send();
                return;
            }

            // Retorna a lista de movimentações com status 200
            res.status(200).json(listaDeMovimentacoes);

        } catch (error) {

            console.error(
                `[MovimentacaoController] Erro ao listar movimentações:`,
                error
            );

            res.status(500).json({
                mensagem:
                    "Erro interno ao recuperar a lista de movimentações."
            });
        }
    }

    /**
     * Busca e retorna uma movimentação específica pelo ID informado na URL.
     *
     * @param req Espera o parâmetro "id" na URL.
     * @param res Objeto de resposta HTTP.
     * @returns 200 com MovimentacaoDTO | 400 se o ID for inválido |
     * 404 se não encontrada | 500 em caso de erro interno.
     */
    static async movimentacao(req: Request, res: Response) {
        try {

            // Lê o parâmetro "id" da URL e converte para número inteiro
            const idMovimentacao =
                parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({
                    mensagem:
                        "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            // Busca a movimentação no banco de dados
            const movimentacao =
                await Movimentacao.listarMovimentacao(
                    idMovimentacao
                );

            // Retorna a movimentação encontrada
            res.status(200).json(movimentacao);

        } catch (error: any) {

            console.error(
                `[MovimentacaoController] Erro ao buscar movimentação (id: ${req.params.id}):`,
                error
            );

            // Diferencia movimentação não encontrada de erro interno
            if (error.message?.includes("não encontrada")) {
                res.status(404).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem:
                    "Erro interno ao recuperar a movimentação."
            });
        }
    }

    /**
     * Registra uma nova movimentação no estoque.
     *
     * A movimentação pode representar uma entrada ou saída.
     * O trigger do banco de dados é responsável por atualizar
     * automaticamente a quantidade disponível do produto.
     *
     * @param req Espera no body:
     * id_produto, tipo, motivo, quantidade e observacao.
     * preco_unitario_praticado, valor_total e
     * id_movimentacao_origem são opcionais.
     *
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrada com sucesso | 400 se campos obrigatórios
     * estiverem ausentes | 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {

            // Lê o corpo da requisição e tipifica como MovimentacaoDTO
            const dadosRecebidos: MovimentacaoDTO = req.body;

            // Valida os campos obrigatórios
            if (
                !dadosRecebidos.id_produto ||
                !dadosRecebidos.tipo ||
                !dadosRecebidos.motivo ||
                !dadosRecebidos.quantidade ||
                !dadosRecebidos.observacao
            ) {
                res.status(400).json({
                    mensagem:
                        "Campos obrigatórios ausentes: id_produto, tipo, motivo, quantidade e observacao."
                });
                return;
            }

            // Cria um novo objeto Movimentacao com os dados recebidos
            const novaMovimentacao = new Movimentacao(
                dadosRecebidos.id_produto,
                dadosRecebidos.tipo,
                dadosRecebidos.motivo,
                dadosRecebidos.quantidade,
                dadosRecebidos.observacao,
                dadosRecebidos.preco_unitario_praticado,
                dadosRecebidos.valor_total,
                dadosRecebidos.id_movimentacao_origem
            );

            // Persiste a movimentação no banco de dados
            // O trigger do PostgreSQL atualizará o estoque automaticamente
            const result =
                await Movimentacao.cadastrarMovimentacao(
                    novaMovimentacao
                );

            // Verifica se o cadastro foi realizado
            if (result) {

                res.status(201).json({
                    mensagem:
                        "Movimentação cadastrada com sucesso."
                });

            } else {

                res.status(400).json({
                    mensagem:
                        "Não foi possível cadastrar a movimentação."
                });
            }

        } catch (error: any) {

            console.error(
                `[MovimentacaoController] Erro ao cadastrar movimentação:`,
                error
            );

            /*
             * Os triggers e CHECK constraints do PostgreSQL
             * podem gerar erros de regra de negócio, por exemplo:
             *
             * - produto inexistente
             * - produto desativado
             * - estoque insuficiente
             * - quantidade inválida
             * - combinação inválida de tipo e motivo
             *
             * Como o model repassa o erro original do banco,
             * podemos retorná-lo como Bad Request.
             */

            if (
                error.message?.includes("Produto não encontrado") ||
                error.message?.includes("Produto desativado") ||
                error.message?.includes("Estoque insuficiente") ||
                error.message?.includes("violates check constraint")
            ) {
                res.status(400).json({
                    mensagem: error.message
                });
                return;
            }

            res.status(500).json({
                mensagem:
                    "Erro interno ao cadastrar a movimentação."
            });
        }
    }
}

// Exporta o controller para ser utilizado no arquivo de rotas
export default MovimentacaoController;