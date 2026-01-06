// Script de teste para verificar bcrypt
const bcrypt = require('bcryptjs');

// Simula a criação de um funcionário
const senhaOriginal = '123456';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(senhaOriginal, salt);

console.log('=== TESTE DE BCRYPT ===');
console.log('Senha original:', senhaOriginal);
console.log('Salt:', salt);
console.log('Hash gerado:', hashedPassword);
console.log('Tamanho do hash:', hashedPassword.length);
console.log('');

// Simula o login
console.log('=== TESTE DE LOGIN ===');
const senhaDigitada = '123456';
const resultado = bcrypt.compareSync(senhaDigitada, hashedPassword);
console.log('Senha digitada:', senhaDigitada);
console.log('Comparação com hash:', resultado);
console.log('');

// Teste com senha errada
const senhaErrada = '654321';
const resultadoErrado = bcrypt.compareSync(senhaErrada, hashedPassword);
console.log('Senha errada:', senhaErrada);
console.log('Comparação com hash:', resultadoErrado);
