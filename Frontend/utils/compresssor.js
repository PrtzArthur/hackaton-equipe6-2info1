export function comprimirImagemParaBase64(arquivo, larguraMaxima = 600, qualidade = 0.7) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.readAsDataURL(arquivo);
    leitor.onload = (evento) => {
      const img = new Image();
      img.src = evento.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let largura = img.width;
        let altura = img.height;
        if (largura > larguraMaxima) {
          altura = Math.round((altura * larguraMaxima) / largura);
          largura = larguraMaxima;
        }

        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, largura, altura);
        const base64Comprimido = canvas.toDataURL('image/jpeg', qualidade);
        resolve(base64Comprimido);
      };
      img.onerror = (err) => reject(err);
    };
    leitor.onerror = (err) => reject(err);
  });
}
