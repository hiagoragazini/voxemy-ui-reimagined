
// Função para gerar cores de avatar baseadas no nome
export function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-100", "bg-sky-100", "bg-cyan-100", 
    "bg-teal-100", "bg-blue-100", "bg-sky-100",
    "bg-cyan-100", "bg-teal-100", "bg-blue-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
