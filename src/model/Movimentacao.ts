import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

export interface FiltroMovimentacao {
    id_produto?: number;
    tipo?: string;
    motivo?: string;
    data_inicio?: string;
    data_fim?: string;
}

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
        | 'PERDA'
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
            | 'PERDA'
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
        id_movimentacao_origem: number | undefined
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
        | 'PERDA'
        | 'CORRECAO' {
        return this.motivo;
    }

    public setMotivo(
        motivo:
            | 'RECEBIMENTO'
            | 'VENDA'
            | 'DANIFICADO'
            | 'USO_INTERNO'
            | 'PERDA'
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
        preco_unitario_praticado: number | undefined
    ): void {
        this.preco_unitario_praticado = preco_unitario_praticado;
    }

    public getValorTotal(): number | undefined {
        return this.valor_total;
    }

    public setValorTotal(valor_total: number | undefined): void {
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
        const preco = movimentacao.preco_unitario_praticado !== null && movimentacao.preco_unitario_praticado !== undefined
            ? (typeof movimentacao.preco_unitario_praticado === 'string' ? parseFloat(movimentacao.preco_unitario_praticado) : Number(movimentacao.preco_unitario_praticado))
            : undefined;

        const total = movimentacao.valor_total !== null && movimentacao.valor_total !== undefined
            ? (typeof movimentacao.valor_total === 'string' ? parseFloat(movimentacao.valor_total) : Number(movimentacao.valor_total))
            : undefined;

        return {
            id_movimentacao: Number(movimentacao.id_movimentacao),
            id_produto: Number(movimentacao.id_produto),
            produto_codigo: movimentacao.produto_codigo,
            produto_nome: movimentacao.produto_nome,
            id_movimentacao_origem: movimentacao.id_movimentacao_origem ? Number(movimentacao.id_movimentacao_origem) : undefined,
            tipo: movimentacao.tipo,
            motivo: movimentacao.motivo,
            quantidade: Number(movimentacao.quantidade),
            preco_unitario_praticado: preco,
            valor_total: total,
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

    static async listarMovimentacoes(filtros?: FiltroMovimentacao): Promise<MovimentacaoDTO[]> {

        try {
            let query = `
                SELECT 
                    m.id_movimentacao,
                    m.id_produto,
                    m.id_movimentacao_origem,
                    m.tipo,
                    m.motivo,
                    m.quantidade,
                    m.preco_unitario_praticado,
                    m.valor_total,
                    m.observacao,
                    m.data_movimentacao,
                    p.codigo AS produto_codigo,
                    p.nome AS produto_nome
                FROM movimentacao m
                INNER JOIN produto p ON p.id_produto = m.id_produto
                WHERE 1=1
            `;

            const valores: any[] = [];
            let index = 1;

            if (filtros?.id_produto) {
                query += ` AND m.id_produto = $${index++}`;
                valores.push(filtros.id_produto);
            }

            if (filtros?.tipo) {
                query += ` AND m.tipo = $${index++}`;
                valores.push(filtros.tipo);
            }

            if (filtros?.motivo) {
                query += ` AND m.motivo = $${index++}`;
                valores.push(filtros.motivo);
            }

            if (filtros?.data_inicio) {
                query += ` AND m.data_movimentacao >= $${index++}`;
                valores.push(filtros.data_inicio);
            }

            if (filtros?.data_fim) {
                query += ` AND m.data_movimentacao <= $${index++}`;
                valores.push(`${filtros.data_fim} 23:59:59`);
            }

            query += ` ORDER BY m.data_movimentacao DESC;`;

            const respostaBD = await database.query(query, valores);

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
                SELECT 
                    m.id_movimentacao,
                    m.id_produto,
                    m.id_movimentacao_origem,
                    m.tipo,
                    m.motivo,
                    m.quantidade,
                    m.preco_unitario_praticado,
                    m.valor_total,
                    m.observacao,
                    m.data_movimentacao,
                    p.codigo AS produto_codigo,
                    p.nome AS produto_nome
                FROM movimentacao m
                INNER JOIN produto p ON p.id_produto = m.id_produto
                WHERE m.id_movimentacao = $1;
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

    // ==================== PATCH ====================

    static async atualizarObservacao(
        id_movimentacao: number,
        observacao: string
    ): Promise<boolean> {
        try {
            await Movimentacao.listarMovimentacao(id_movimentacao);

            const query = `
                UPDATE movimentacao
                SET observacao = $1
                WHERE id_movimentacao = $2;
            `;

            const respostaBD = await database.query(query, [observacao, id_movimentacao]);
            return (respostaBD.rowCount ?? 0) > 0;
        } catch (error) {
            console.error(
                `[MovimentacaoModel] Erro ao retificar observação da movimentação (id: ${id_movimentacao}):`,
                error
            );
            throw error;
        }
    }

    // ==================== DELETE (ESTORNO / CORREÇÃO AUTOMÁTICA) ====================

    static async estornarMovimentacao(
        id_movimentacao: number,
        motivo_estorno?: string
    ): Promise<MovimentacaoDTO> {
        try {
            const original = await Movimentacao.listarMovimentacao(id_movimentacao);

            // Verifica se esta movimentação já foi estornada anteriormente
            const checkJaEstornada = await database.query(
                `SELECT id_movimentacao FROM movimentacao WHERE id_movimentacao_origem = $1 AND motivo = 'CORRECAO'`,
                [id_movimentacao]
            );

            if (checkJaEstornada.rowCount && checkJaEstornada.rowCount > 0) {
                throw new Error(`A movimentação #${id_movimentacao} já foi estornada anteriormente pela movimentação de correção #${checkJaEstornada.rows[0].id_movimentacao}.`);
            }

            // Inverte o tipo para desfazer o impacto no estoque
            const tipoInverso: 'ENTRADA' | 'SAIDA' = original.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
            const obsEstorno = motivo_estorno 
                ? `Estorno da movimentação #${id_movimentacao}: ${motivo_estorno}`
                : `Estorno/Anulação da movimentação #${id_movimentacao} (${original.tipo} - ${original.motivo})`;

            const query = `
                INSERT INTO movimentacao (
                    id_produto,
                    id_movimentacao_origem,
                    tipo,
                    motivo,
                    quantidade,
                    observacao
                )
                VALUES ($1, $2, $3, 'CORRECAO', $4, $5)
                RETURNING *;
            `;

            const respostaBD = await database.query(query, [
                original.id_produto,
                id_movimentacao,
                tipoInverso,
                original.quantidade,
                obsEstorno
            ]);

            return Movimentacao.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(
                `[MovimentacaoModel] Erro ao estornar movimentação (id: ${id_movimentacao}):`,
                error
            );
            throw error;
        }
    }
}

export default Movimentacao;