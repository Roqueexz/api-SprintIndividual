import Movimentacao, { type FiltroMovimentacao } from "../model/Movimentacao.js";
import { type Request, type Response } from "express";
import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";

class MovimentacaoController extends Movimentacao {

    /**
     * Lista movimentações com filtros opcionais via query parameters.
     */
    static async todos(req: Request, res: Response) {
        try {
            const filtros: FiltroMovimentacao = {};

            if (req.query.id_produto) {
                filtros.id_produto = parseInt(req.query.id_produto as string);
            }
            if (req.query.tipo) {
                filtros.tipo = req.query.tipo as string;
            }
            if (req.query.motivo) {
                filtros.motivo = req.query.motivo as string;
            }
            if (req.query.data_inicio) {
                filtros.data_inicio = req.query.data_inicio as string;
            }
            if (req.query.data_fim) {
                filtros.data_fim = req.query.data_fim as string;
            }

            const listaDeMovimentacoes =
                await Movimentacao.listarMovimentacoes(filtros);

            if (listaDeMovimentacoes.length === 0) {
                res.status(204).send();
                return;
            }

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
     */
    static async movimentacao(req: Request, res: Response) {
        try {
            const idMovimentacao =
                parseInt(req.params.id as string);

            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({
                    mensagem:
                        "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const movimentacao =
                await Movimentacao.listarMovimentacao(
                    idMovimentacao
                );

            res.status(200).json(movimentacao);

        } catch (error: any) {
            console.error(
                `[MovimentacaoController] Erro ao buscar movimentação (id: ${req.params.id}):`,
                error
            );

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
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: MovimentacaoDTO = req.body;

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

            // Regras adicionais de validação prévia
            if (dadosRecebidos.motivo === 'VENDA') {
                if (dadosRecebidos.tipo !== 'SAIDA') {
                    res.status(400).json({
                        mensagem: "Movimentação de venda deve ser obrigatoriamente do tipo SAIDA."
                    });
                    return;
                }
                if (dadosRecebidos.preco_unitario_praticado === undefined || dadosRecebidos.preco_unitario_praticado === null) {
                    res.status(400).json({
                        mensagem: "Preço unitário praticado é obrigatório para vendas."
                    });
                    return;
                }
                // Calcula automaticamente o valor total se não enviado
                dadosRecebidos.valor_total = dadosRecebidos.quantidade * dadosRecebidos.preco_unitario_praticado;
            }

            if (dadosRecebidos.motivo === 'CORRECAO' && !dadosRecebidos.id_movimentacao_origem) {
                res.status(400).json({
                    mensagem: "Movimentação de correção exige a indicação da movimentação de origem."
                });
                return;
            }

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

            const result =
                await Movimentacao.cadastrarMovimentacao(
                    novaMovimentacao
                );

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

            const msg = error.message || "";

            if (
                msg.includes("Produto não encontrado") ||
                msg.includes("desativado") ||
                msg.includes("Estoque insuficiente") ||
                msg.includes("violates check constraint") ||
                msg.includes("não pode ser alterada")
            ) {
                res.status(400).json({
                    mensagem: msg
                });
                return;
            }

            res.status(500).json({
                mensagem:
                    "Erro interno ao cadastrar a movimentação."
            });
        }
    }

    /**
     * Retifica a observação de uma movimentação confirmada (PATCH /api/movimentacoes/:id).
     */
    static async atualizarParcial(req: Request, res: Response) {
        try {
            const idMovimentacao = parseInt(req.params.id as string);

            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const { observacao } = req.body;

            if (!observacao || typeof observacao !== 'string' || !observacao.trim()) {
                res.status(400).json({
                    mensagem: "Informe a observação para retificação da movimentação."
                });
                return;
            }

            const result = await Movimentacao.atualizarObservacao(idMovimentacao, observacao.trim());

            if (result) {
                res.status(200).json({
                    mensagem: "Observação da movimentação atualizada com sucesso."
                });
            } else {
                res.status(404).json({
                    mensagem: "Movimentação não encontrada."
                });
            }

        } catch (error: any) {
            console.error(
                `[MovimentacaoController] Erro ao retificar observação (id: ${req.params.id}):`,
                error
            );

            if (error.message?.includes("não encontrada")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao atualizar observação da movimentação."
            });
        }
    }

    /**
     * Anula/Estorna uma movimentação confirmada (DELETE /api/movimentacoes/:id).
     * Conforme as regras de negócio RN07 e RN08, movimentações confirmadas não podem ser
     * excluídas fisicamente. Este endpoint registra uma movimentação de CORREÇÃO
     * invertendo a quantidade e restaurando o saldo do estoque com rastreabilidade total.
     */
    static async remover(req: Request, res: Response) {
        try {
            const idMovimentacao = parseInt(req.params.id as string);

            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({
                    mensagem: "ID inválido. Informe um número inteiro positivo."
                });
                return;
            }

            const { motivo } = req.body || {};
            const correcao = await Movimentacao.estornarMovimentacao(idMovimentacao, motivo);

            res.status(200).json({
                mensagem: `Movimentação #${idMovimentacao} estornada com sucesso! Uma movimentação de correção (#${correcao.id_movimentacao}) foi registrada para reverter o saldo do produto.`,
                movimentacao_correcao: correcao
            });

        } catch (error: any) {
            console.error(
                `[MovimentacaoController] Erro ao estornar movimentação (id: ${req.params.id}):`,
                error
            );

            const msg = error.message || "";

            if (msg.includes("já foi estornada") || msg.includes("Estoque insuficiente")) {
                res.status(400).json({ mensagem: msg });
                return;
            }

            if (msg.includes("não encontrada")) {
                res.status(404).json({ mensagem: msg });
                return;
            }

            res.status(500).json({
                mensagem: "Erro interno ao estornar a movimentação."
            });
        }
    }
}

export default MovimentacaoController;