import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Movimentacao {

    private id_movimentacao: number = 0;
    private id_produto: number;
    private id_movimentacao_origem: number | undefined;
    private tipo: 'ENTRADA' | 'SAIDA';
    private motivo:
        | 'RECEBIMENTO'
        | 'VENDA'
        | 'DANIFICADO'
        | 'USO_INTERNO'
        | 'CORRECAO';

    private quantidade: number;
    private preco_unitario_praticado?: number | undefined;
    private valor_total?: number | undefined;
    private observacao: string;
    private data_movimentacao: Date;

    constructor(
        _id_produto: number,
        _tipo: 'ENTRADA' | 'SAIDA',
        _motivo:
            | 'RECEBIMENTO'
            | 'VENDA'
            | 'DANIFICADO'
            | 'USO_INTERNO'
            | 'CORRECAO',
        _quantidade: number,
        _observacao: string,
        _preco_unitario_praticado?: number,
        _valor_total?: number,
        _id_movimentacao_origem?: number
    ) {
        this.id_produto = _id_produto;
        this.tipo = _tipo;
        this.motivo = _motivo;
        this.quantidade = _quantidade;
        this.observacao = _observacao;
        this.preco_unitario_praticado = _preco_unitario_praticado;
        this.valor_total = _valor_total;
        this.id_movimentacao_origem = _id_movimentacao_origem;
        this.data_movimentacao = new Date();
    }

    // ==================== GETTERS E SETTERS ====================

    public getIdMovimentacao(): number {
        return this.id_movimentacao;
    }

    public setIdMovimentacao(id_movimentacao: number): void {
        this.id_movimentacao = id_movimentacao;
    }

    public getIdProduto(): number {
        return this.id_produto;
    }

    public setIdProduto(id_produto: number): void {
        this.id_produto = id_produto;
    }

    public getIdMovimentacaoOrigem(): number | undefined {
        return this.id_movimentacao_origem;
    }

    public setIdMovimentacaoOrigem(
        id_movimentacao_origem: number
    ): void {
        this.id_movimentacao_origem = id_movimentacao_origem;
    }

    public getTipo(): 'ENTRADA' | 'SAIDA' {
        return this.tipo;
    }

    public setTipo(tipo: 'ENTRADA' | 'SAIDA'): void {
        this.tipo = tipo;
    }

    public getMotivo():
        | 'RECEBIMENTO'
        | 'VENDA'
        | 'DANIFICADO'
        | 'USO_INTERNO'
        | 'CORRECAO' {
        return this.motivo;
    }

    public setMotivo(
        motivo:
            | 'RECEBIMENTO'
            | 'VENDA'
            | 'DANIFICADO'
            | 'USO_INTERNO'
            | 'CORRECAO'
    ): void {
        this.motivo = motivo;
    }

    public getQuantidade(): number {
        return this.quantidade;
    }

    public setQuantidade(quantidade: number): void {
        this.quantidade = quantidade;
    }

    public getPrecoUnitarioPraticado(): number | undefined {
        return this.preco_unitario_praticado;
    }

    public setPrecoUnitarioPraticado(
        preco_unitario_praticado: number
    ): void {
        this.preco_unitario_praticado = preco_unitario_praticado;
    }

    public getValorTotal(): number | undefined {
        return this.valor_total;
    }

    public setValorTotal(valor_total: number): void {
        this.valor_total = valor_total;
    }

    public getObservacao(): string {
        return this.observacao;
    }

    public setObservacao(observacao: string): void {
        this.observacao = observacao;
    }

    public getDataMovimentacao(): Date {
        return this.data_movimentacao;
    }

    public setDataMovimentacao(data_movimentacao: Date): void {
        this.data_movimentacao = data_movimentacao;
    }

    // ==================== MÉTODO PRIVADO: toDTO ====================

    private static toDTO(
        movimentacao: any
    ): MovimentacaoDTO {

        return {
            id_movimentacao: movimentacao.id_movimentacao,
            id_produto: movimentacao.id_produto,
            id_movimentacao_origem:
                movimentacao.id_movimentacao_origem,
            tipo: movimentacao.tipo,
            motivo: movimentacao.motivo,
            quantidade: movimentacao.quantidade,
            preco_unitario_praticado:
                movimentacao.preco_unitario_praticado,
            valor_total: movimentacao.valor_total,
            observacao: movimentacao.observacao,
            data_movimentacao: movimentacao.data_movimentacao
        };
    }

    // ==================== CREATE ====================

    static async cadastrarMovimentacao(
        movimentacao: Movimentacao
    ): Promise<boolean> {

        try {

            const query = `
                INSERT INTO movimentacao (
                    id_produto,
                    id_movimentacao_origem,
                    tipo,
                    motivo,
                    quantidade,
                    preco_unitario_praticado,
                    valor_total,
                    observacao
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_movimentacao;
            `;

            const valores = [
                movimentacao.getIdProduto(),
                movimentacao.getIdMovimentacaoOrigem() ?? null,
                movimentacao.getTipo(),
                movimentacao.getMotivo(),
                movimentacao.getQuantidade(),
                movimentacao.getPrecoUnitarioPraticado() ?? null,
                movimentacao.getValorTotal() ?? null,
                movimentacao.getObservacao()
            ];

            const respostaBD = await database.query(
                query,
                valores
            );

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    "INSERT não retornou ID — movimentação não foi registrada."
                );
            }

            console.info(
                `[MovimentacaoModel] Movimentação registrada. ID: ${respostaBD.rows[0].id_movimentacao}`
            );

            return true;

        } catch (error) {

            console.error(
                `[MovimentacaoModel] Erro ao cadastrar movimentação:`,
                error
            );

            throw error;
        }
    }

    // ==================== READ ====================

    static async listarMovimentacoes(): Promise<MovimentacaoDTO[]> {

        try {

            const query = `
                SELECT *
                FROM movimentacao
                ORDER BY data_movimentacao DESC;
            `;

            const respostaBD = await database.query(query);

            return respostaBD.rows.map(
                Movimentacao.toDTO
            );

        } catch (error) {

            console.error(
                `[MovimentacaoModel] Erro ao listar movimentações:`,
                error
            );

            throw error;
        }
    }

    static async listarMovimentacao(
        id_movimentacao: number
    ): Promise<MovimentacaoDTO> {

        try {

            const query = `
                SELECT *
                FROM movimentacao
                WHERE id_movimentacao = $1;
            `;

            const respostaBD = await database.query(
                query,
                [id_movimentacao]
            );

            if (respostaBD.rows.length === 0) {
                throw new Error(
                    `Movimentação com ID ${id_movimentacao} não encontrada.`
                );
            }

            return Movimentacao.toDTO(
                respostaBD.rows[0]
            );

        } catch (error) {

            console.error(
                `[MovimentacaoModel] Erro ao buscar movimentação (id: ${id_movimentacao}):`,
                error
            );

            throw error;
        }
    }
}

export default Movimentacao;