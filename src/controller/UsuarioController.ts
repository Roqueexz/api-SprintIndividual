import { type Request, type Response } from 'express';
import { DatabaseModel } from '../model/DatabaseModel.js';

const database = new DatabaseModel().pool;

export class UsuarioController {

    /**
     * Cadastra um novo usuário no sistema
     */
    static async cadastrar(req: Request, res: Response): Promise<any> {
        const { nome, email, senha, role } = req.body;

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
            const roleFinal = role === 'ADMIN' ? 'ADMIN' : 'OPERADOR';
            const checkQuery = `SELECT id_usuario FROM usuario WHERE email = $1`;
            const checkResult = await database.query(checkQuery, [email.trim().toLowerCase()]);

            if (checkResult.rowCount && checkResult.rowCount > 0) {
                return res.status(409).json({
                    mensagem: 'Este e-mail já está cadastrado. Utilize outro e-mail ou faça login.'
                });
            }

            const insertQuery = `
                INSERT INTO usuario (nome, email, senha, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id_usuario, nome, email, role, data_cadastro
            `;
            const result = await database.query(insertQuery, [
                nome.trim(),
                email.trim().toLowerCase(),
                senha,
                roleFinal
            ]);

            return res.status(201).json({
                mensagem: 'Usuário cadastrado com sucesso!',
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
     * Lista todos os usuários
     */
    static async todos(req: Request, res: Response): Promise<any> {
        try {
            const query = `
                SELECT id_usuario, nome, email, role, data_cadastro
                FROM usuario
                ORDER BY nome ASC
            `;
            const result = await database.query(query);

            if (result.rows.length === 0) {
                return res.status(204).send();
            }

            return res.status(200).json(result.rows);
        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao listar usuários: ${error}`);
            return res.status(500).json({
                mensagem: 'Erro ao listar usuários.',
                detalhes: error.message
            });
        }
    }

    /**
     * Busca usuário pelo ID (GET /api/usuarios/:id)
     */
    static async usuario(req: Request, res: Response): Promise<any> {
        try {
            const idUsuario = parseInt(req.params.id as string);

            if (isNaN(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensagem: 'ID inválido. Informe um número inteiro positivo.'
                });
            }

            const query = `
                SELECT id_usuario, nome, email, role, data_cadastro
                FROM usuario
                WHERE id_usuario = $1
            `;
            const result = await database.query(query, [idUsuario]);

            if (result.rows.length === 0) {
                return res.status(404).json({ mensagem: `Usuário com ID ${idUsuario} não encontrado.` });
            }

            return res.status(200).json(result.rows[0]);

        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao buscar usuário (id: ${req.params.id}):`, error);
            return res.status(500).json({ mensagem: 'Erro interno ao recuperar o usuário.' });
        }
    }

    /**
     * Atualização completa do usuário (PUT /api/usuarios/:id)
     */
    static async atualizar(req: Request, res: Response): Promise<any> {
        try {
            const idUsuario = parseInt(req.params.id as string);

            if (isNaN(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensagem: 'ID inválido. Informe um número inteiro positivo.'
                });
            }

            const { nome, email, senha, role } = req.body;

            if (!nome || !email) {
                return res.status(400).json({
                    mensagem: 'Campos obrigatórios ausentes: nome e email.'
                });
            }

            const roleFinal = role === 'ADMIN' ? 'ADMIN' : 'OPERADOR';
            let query = '';
            let valores: any[] = [];

            if (senha) {
                query = `
                    UPDATE usuario
                    SET nome = $1, email = $2, senha = $3, role = $4
                    WHERE id_usuario = $5
                `;
                valores = [nome.trim(), email.trim().toLowerCase(), senha, roleFinal, idUsuario];
            } else {
                query = `
                    UPDATE usuario
                    SET nome = $1, email = $2, role = $3
                    WHERE id_usuario = $4
                `;
                valores = [nome.trim(), email.trim().toLowerCase(), roleFinal, idUsuario];
            }

            const result = await database.query(query, valores);

            if ((result.rowCount ?? 0) > 0) {
                return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso.' });
            } else {
                return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
            }

        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao atualizar usuário (id: ${req.params.id}):`, error);

            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                return res.status(409).json({ mensagem: 'Este e-mail já está sendo utilizado por outro usuário.' });
            }

            return res.status(500).json({ mensagem: 'Erro interno ao atualizar usuário.' });
        }
    }

    /**
     * Atualização parcial do usuário (PATCH /api/usuarios/:id)
     */
    static async atualizarParcial(req: Request, res: Response): Promise<any> {
        try {
            const idUsuario = parseInt(req.params.id as string);

            if (isNaN(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensagem: 'ID inválido. Informe um número inteiro positivo.'
                });
            }

            const { nome, email, senha, role } = req.body;
            const campos: string[] = [];
            const valores: any[] = [];
            let index = 1;

            if (nome !== undefined) {
                campos.push(`nome = $${index++}`);
                valores.push(nome.trim());
            }
            if (email !== undefined) {
                campos.push(`email = $${index++}`);
                valores.push(email.trim().toLowerCase());
            }
            if (senha !== undefined && senha.trim() !== '') {
                campos.push(`senha = $${index++}`);
                valores.push(senha);
            }
            if (role !== undefined) {
                campos.push(`role = $${index++}`);
                valores.push(role === 'ADMIN' ? 'ADMIN' : 'OPERADOR');
            }

            if (campos.length === 0) {
                return res.status(200).json({ mensagem: 'Nenhum campo fornecido para atualização.' });
            }

            valores.push(idUsuario);
            const query = `
                UPDATE usuario
                SET ${campos.join(', ')}
                WHERE id_usuario = $${index}
            `;

            const result = await database.query(query, valores);

            if ((result.rowCount ?? 0) > 0) {
                return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso.' });
            } else {
                return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
            }

        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao atualizar parcialmente usuário (id: ${req.params.id}):`, error);

            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                return res.status(409).json({ mensagem: 'Este e-mail já está sendo utilizado por outro usuário.' });
            }

            return res.status(500).json({ mensagem: 'Erro interno ao atualizar parcialmente usuário.' });
        }
    }

    /**
     * Remove um usuário do sistema (DELETE /api/usuarios/:id)
     */
    static async remover(req: Request, res: Response): Promise<any> {
        try {
            const idUsuario = parseInt(req.params.id as string);

            if (isNaN(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensagem: 'ID inválido. Informe um número inteiro positivo.'
                });
            }

            const query = `DELETE FROM usuario WHERE id_usuario = $1`;
            const result = await database.query(query, [idUsuario]);

            if ((result.rowCount ?? 0) > 0) {
                return res.status(200).json({ mensagem: 'Usuário removido com sucesso.' });
            } else {
                return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
            }

        } catch (error: any) {
            console.error(`[UsuarioController] Erro ao remover usuário (id: ${req.params.id}):`, error);
            return res.status(500).json({ mensagem: 'Erro interno ao remover usuário.' });
        }
    }
}

export default UsuarioController;
