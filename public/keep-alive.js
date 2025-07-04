// keep-alive.js - Mantém a página "viva" mesmo quando em segundo plano
// Isso ajuda a prevenir que o navegador descarregue a página quando o usuário muda de aba

(function() {
  // Variável para controlar se a página está visível ou não
  let isPageVisible = true;
  
  // Função que será executada periodicamente para manter a página ativa
  function keepAlive() {
    // Se a página estiver visível, usamos requestAnimationFrame para manter o loop
    // Se estiver em segundo plano, usamos setTimeout com intervalo maior para economizar recursos
    if (isPageVisible) {
      requestAnimationFrame(keepAlive);
    } else {
      // Quando em segundo plano, executamos a cada 20 segundos para manter a página viva
      // mas sem consumir muitos recursos
      setTimeout(keepAlive, 20000);
    }
  }
  
  // Detecta mudanças na visibilidade da página
  document.addEventListener('visibilitychange', function() {
    isPageVisible = document.visibilityState === 'visible';
    
    // Se a página voltar a ficar visível, reiniciamos o loop com requestAnimationFrame
    if (isPageVisible) {
      requestAnimationFrame(keepAlive);
      
      // Disparar evento personalizado para que componentes possam reagir à restauração da página
      const pageShowEvent = new CustomEvent('app:pageshow', { 
        detail: { persisted: true } 
      });
      window.dispatchEvent(pageShowEvent);
      
      console.log('Página voltou a ficar visível');
    } else {
      console.log('Página em segundo plano');
    }
  });
  
  // Inicia o loop de keep-alive
  keepAlive();
  
  // Adicionar listener para o evento pageshow nativo do navegador
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      console.log('Página restaurada do BFCache');
      
      // Disparar evento personalizado para que componentes possam reagir à restauração da página
      const pageShowEvent = new CustomEvent('app:pageshow', { 
        detail: { persisted: true, fromBFCache: true } 
      });
      window.dispatchEvent(pageShowEvent);
    }
  });
  
  // Adicionar listener para o evento beforeunload para salvar dados importantes
  window.addEventListener('beforeunload', function() {
    // Aqui poderíamos adicionar lógica para salvar dados importantes
    // antes que a página seja descarregada
    console.log('Página prestes a ser descarregada');
  });
  
  console.log('Sistema keep-alive iniciado');
})();
