# Instruções para Limpar Registros Duplicados

## Problema Identificado
Existem 2 funcionários com a matrícula 410 no banco de dados, causando falha no login.

## Solução Implementada no Código
1. **Login**: Agora aceita múltiplos registros e usa o mais recente
2. **Cadastro**: Valida se a matrícula já existe antes de criar

## Como Limpar os Registros Duplicados Manualmente

### Opção 1: Via Firebase Console (Recomendado)
1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto: **drh-ci**
3. Vá em **Firestore Database**
4. Navegue até a coleção **funcionarios**
5. Procure por registros com `matricula = 410`
6. Identifique o registro mais antigo (ou o que tem dados incorretos)
7. Clique no registro e depois em **Delete document**
8. Mantenha apenas 1 registro com a matrícula 410

### Opção 2: Via Código (Script de Limpeza)
Você pode criar um script temporário para limpar duplicatas:

```typescript
// No console do navegador, após fazer login como admin:
// 1. Abra o DevTools (F12)
// 2. Vá na aba Console
// 3. Cole e execute este código:

// ATENÇÃO: Este código deve ser executado apenas uma vez!
async function limparDuplicatas() {
  const db = firebase.firestore();
  const snapshot = await db.collection('funcionarios')
    .where('matricula', '==', 410)
    .get();
  
  console.log(`Encontrados ${snapshot.size} registros com matrícula 410`);
  
  if (snapshot.size > 1) {
    // Ordena por data de criação (se disponível) ou mantém o último
    const docs = snapshot.docs;
    
    // Remove todos exceto o último
    for (let i = 0; i < docs.length - 1; i++) {
      console.log(`Removendo registro: ${docs[i].id}`);
      await docs[i].ref.delete();
    }
    
    console.log('Limpeza concluída! Mantido apenas 1 registro.');
  } else {
    console.log('Nenhuma duplicata encontrada.');
  }
}

limparDuplicatas();
```

## Verificação
Após limpar, tente fazer login novamente. O console deve mostrar:
```
[LOGIN] Resultados da busca - String: 0 Number: 1
[LOGIN] Usuário encontrado. ID: ...
```

## Prevenção
O código agora previne a criação de duplicatas. Se tentar criar um funcionário com matrícula já existente, você verá:
```
Erro: Já existe um funcionário cadastrado com a matrícula XXX
```
