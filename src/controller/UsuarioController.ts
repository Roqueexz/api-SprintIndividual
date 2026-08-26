import { type Request, type Response } from 'express';
import { DatabaseModel } from '../model/DatabaseModel.js';

const database = new DatabaseModel().pool;

export class UsuarioController {

    /**
     * Cadastra um novo usuário no sistema (rota pública)
     */
    static async cadastrar(req: Request, res: Response): Promise<any> {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: 'Informe nome, e-mail e senha para cadastrar.'
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                mensagem: 'A senha deve ter pelo menos 6 caracteres.'
            });
        }

        try {
            // Verifica se o e-mail já está em uso
            const checkQuery = `SELECT id_usuario FROM usuario WHERE email = $1`;
            const checkResult = await database.query(checkQuery, [email]);

            if (checkResult.rowCount && checkResult.rowCount > 0) {
                return res.status(409).json({
                    mensagem: 'Este e-mail já está cadastrado. Utilize outro e-mail ou faça login.'
                });
            }

            const insertQuery = `
                INSERT INTO usuario (nome, email, senha, role)
                VALUES ($1, $2, $3, 'OPERADOR')
                RETURNING id_usuario, nome, email, role, data_cadastro
            `;
            const result = await database.query(insertQuery, [nome, email, senha]);

            return res.status(201).json({
                mensagem: 'Conta criada com sucesso! Faça login para acessar o sistema.',
                usuario: result.rows[0]
            });

        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao cadastrar usuário: ${error}`);
            return res.status(500).json({
                mensagem: 'Erro interno ao tentar cadastrar o usuário.',
                detalhes: error.message
            });
        }
    }

    /**
     * Lista todos os usuários (rota administrativa)
     */
    static async todos(req: Request, res: Response): Promise<any> {
        try {
            const query = `
                SELECT id_usuario, nome, email, role, data_cadastro
                FROM usuario
                ORDER BY nome ASC
            `;
            const result = await database.query(query);
            return res.status(200).json(result.rows);
        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao listar usuários: ${error}`);
            return res.status(500).json({ mensagem: 'Erro ao listar usuários.', detalhes: error.message });
        }
    }
}
