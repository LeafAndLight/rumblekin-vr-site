# I'm Monster — site atualizado

Atualização de identidade em 9 de setembro de 2026, baseada no Site v1 enviado.

## Reupar o site existente

Extraia este ZIP e copie o conteúdo para a mesma pasta de publicação do site atual, substituindo os arquivos com o mesmo nome. O arquivo index.html precisa ficar no mesmo nível de assets/ e privacy/. No projeto original a pasta de publicação indicada era docs/; mantenha a estrutura e a configuração que você já utiliza.

**Mantenha a pasta assets/fonts/ do site anterior.** O ZIP não inclui arquivos de fonte. O CSS continua apontando para assets/fonts/troika.woff2, já presente no seu pacote original. Não apague essa pasta durante a atualização. Sem a fonte, o site usa a tipografia de sistema de reserva, mas os títulos terão aparência diferente.

Não é necessário instalar pacotes nem executar uma compilação. O arquivo .nojekyll está incluído. Depois da publicação, faça uma atualização forçada no navegador (Ctrl+F5).

## O que foi atualizado

- Nome oficial: I'm Monster, sem o selo VR na logo.
- Logo transparente nos cabeçalhos e rodapés, inclusive na política de privacidade.
- Nome do jogo nos seis idiomas: inglês, português, espanhol, francês, chinês simplificado e hindi.
- Títulos das páginas, descrições, textos alternativos e prévia de compartilhamento.
- Favicon com M e cristal; nomes dos arquivos de identidade atualizados.
- Correções pequenas para evitar títulos cortados no celular e rolagem horizontal, sem redesenhar as seções.
- Preferência de idioma anterior preservada na migração.
- Data de atualização editorial da política: 9 de setembro de 2026. A data de vigência e o conteúdo sobre tratamento de dados foram mantidos; esta alteração não é uma revisão jurídica nem uma verificação das práticas do jogo.

## O que foi mantido

Layout, paleta, seções, animações, navegação, comportamento responsivo e conteúdo de gameplay. Os fundos sem logo usados atrás dos textos da página foram mantidos para não sobrepor marcas aos títulos. As artes promocionais com a nova marca estão incluídas em assets/images/; a arte com logo no topo também gera a prévia de compartilhamento.

Contato e link do estúdio permanecem os do arquivo original. Nada foi publicado automaticamente. A pasta privacy/ continua no mesmo endereço relativo. Se você mudar também o endereço do repositório ou o domínio, confirme depois a URL pública da política nas plataformas em que ela é utilizada.

## Arquivos principais

index.html — página inicial.
privacy/index.html — política de privacidade.
assets/styles.css — layout e estilos.
assets/translations.js — textos em seis idiomas.
assets/script.js — idiomas, navegação e animações.
assets/favicon.svg — ícone do site.
assets/images/im-monster-logo.png — logo com transparência.
assets/images/im-monster-logo-v2.webp — logo otimizada utilizada no site.
assets/images/og-im-monster-v2.jpg — prévia de compartilhamento (1200 × 630).
assets/images/im-monster-keyart-*.webp — novas artes promocionais.

As imagens antigas deixam de ser referenciadas. É seguro deixar os arquivos antigos no servidor durante a atualização. Os novos nomes e a versão dos scripts/estilos evitam reutilizar a identidade antiga do cache.
