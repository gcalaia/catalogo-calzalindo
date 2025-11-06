// 🎯 Configuración del árbol de navegación de Calzalindo
// Estructura de 3 niveles: Categoría Principal > Subcategoría > Productos

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  badge?: string;
  image?: string;
}

export const navigationTree: NavItem[] = [
  {
    label: "Mujer",
    href: "/mujer",
    icon: "👩",
    children: [
      {
        label: "Calzado",
        href: "/mujer/calzado",
        children: [
          {
            label: "Deportivo",
            href: "/mujer/calzado/deportivo",
            icon: "👟",
            children: [
              { label: "Running", href: "/mujer/calzado/deportivo/running", icon: "🏃" },
              { label: "Training", href: "/mujer/calzado/deportivo/training", icon: "🏋️" },
              { label: "Fútbol", href: "/mujer/calzado/deportivo/futbol", icon: "⚽" },
              { label: "Basket", href: "/mujer/calzado/deportivo/basket", icon: "🏀" },
              { label: "Outdoor/Trail", href: "/mujer/calzado/deportivo/outdoor", icon: "🥾" },
              { label: "Skate", href: "/mujer/calzado/deportivo/skate", icon: "🛹" },
              { label: "Tenis", href: "/mujer/calzado/deportivo/tenis", icon: "🎾" },
            ]
          },
          {
            label: "Urbano",
            href: "/mujer/calzado/urbano",
            icon: "👞",
            children: [
              { label: "Zapatillas", href: "/mujer/calzado/urbano/zapatillas" },
              { label: "Zapatos", href: "/mujer/calzado/urbano/zapatos" },
              { label: "Mocasines", href: "/mujer/calzado/urbano/mocasines" },
              { label: "Ballerinas", href: "/mujer/calzado/urbano/ballerinas" },
            ]
          },
          {
            label: "Formal",
            href: "/mujer/calzado/formal",
            icon: "👠",
            children: [
              { label: "Stilettos", href: "/mujer/calzado/formal/stilettos" },
              { label: "Plataforma", href: "/mujer/calzado/formal/plataforma" },
              { label: "Sandalias", href: "/mujer/calzado/formal/sandalias" },
              { label: "Zapatos Clásicos", href: "/mujer/calzado/formal/zapatos-clasicos" },
            ]
          },
          {
            label: "Sandalias",
            href: "/mujer/calzado/sandalias",
            icon: "🩴",
            children: [
              { label: "Ojotas", href: "/mujer/calzado/sandalias/ojotas" },
              { label: "Sandalias Planas", href: "/mujer/calzado/sandalias/planas" },
              { label: "Sandalias con Taco", href: "/mujer/calzado/sandalias/con-taco" },
            ]
          },
          {
            label: "Botas",
            href: "/mujer/calzado/botas",
            icon: "🥾",
            children: [
              { label: "Botinetas", href: "/mujer/calzado/botas/botinetas" },
              { label: "Botas Altas", href: "/mujer/calzado/botas/altas" },
              { label: "Botas de Lluvia", href: "/mujer/calzado/botas/lluvia" },
            ]
          },
        ]
      },
      {
        label: "Temporada",
        href: "/mujer/temporada",
        children: [
          { label: "Verano", href: "/mujer/temporada/verano", icon: "☀️" },
          { label: "Invierno", href: "/mujer/temporada/invierno", icon: "❄️" },
          { label: "Atemporal", href: "/mujer/temporada/atemporal", icon: "🌍" },
        ]
      },
      {
        label: "Marcas Destacadas",
        href: "/mujer/marcas",
        children: [
          { label: "Nike", href: "/mujer/marcas/nike" },
          { label: "Adidas", href: "/mujer/marcas/adidas" },
          { label: "Puma", href: "/mujer/marcas/puma" },
          { label: "Vans", href: "/mujer/marcas/vans" },
          { label: "Converse", href: "/mujer/marcas/converse" },
        ]
      },
      {
        label: "Accesorios",
        href: "/mujer/accesorios",
        icon: "👜",
        children: [
          { label: "Mochilas", href: "/mujer/accesorios/mochilas" },
          { label: "Bolsos", href: "/mujer/accesorios/bolsos" },
          { label: "Medias", href: "/mujer/accesorios/medias" },
          { label: "Gorros", href: "/mujer/accesorios/gorros" },
        ]
      },
      {
        label: "Indumentaria",
        href: "/mujer/indumentaria",
        icon: "👕",
        children: [
          { label: "Remeras", href: "/mujer/indumentaria/remeras" },
          { label: "Buzos", href: "/mujer/indumentaria/buzos" },
          { label: "Pantalones", href: "/mujer/indumentaria/pantalones" },
          { label: "Shorts", href: "/mujer/indumentaria/shorts" },
        ]
      },
    ]
  },
  {
    label: "Hombre",
    href: "/hombre",
    icon: "👨",
    children: [
      {
        label: "Calzado",
        href: "/hombre/calzado",
        children: [
          {
            label: "Deportivo",
            href: "/hombre/calzado/deportivo",
            icon: "👟",
            children: [
              { label: "Running", href: "/hombre/calzado/deportivo/running", icon: "🏃" },
              { label: "Training", href: "/hombre/calzado/deportivo/training", icon: "🏋️" },
              { label: "Fútbol", href: "/hombre/calzado/deportivo/futbol", icon: "⚽" },
              { label: "Basket", href: "/hombre/calzado/deportivo/basket", icon: "🏀" },
              { label: "Outdoor/Trail", href: "/hombre/calzado/deportivo/outdoor", icon: "🥾" },
              { label: "Skate", href: "/hombre/calzado/deportivo/skate", icon: "🛹" },
              { label: "Tenis", href: "/hombre/calzado/deportivo/tenis", icon: "🎾" },
            ]
          },
          {
            label: "Urbano",
            href: "/hombre/calzado/urbano",
            icon: "👞",
            children: [
              { label: "Zapatillas", href: "/hombre/calzado/urbano/zapatillas" },
              { label: "Zapatos", href: "/hombre/calzado/urbano/zapatos" },
              { label: "Mocasines", href: "/hombre/calzado/urbano/mocasines" },
              { label: "Náuticos", href: "/hombre/calzado/urbano/nauticos" },
            ]
          },
          {
            label: "Formal",
            href: "/hombre/calzado/formal",
            icon: "👞",
            children: [
              { label: "Oxfords", href: "/hombre/calzado/formal/oxfords" },
              { label: "Derbies", href: "/hombre/calzado/formal/derbies" },
              { label: "Mocasines", href: "/hombre/calzado/formal/mocasines" },
            ]
          },
          {
            label: "Sandalias",
            href: "/hombre/calzado/sandalias",
            icon: "🩴",
            children: [
              { label: "Ojotas", href: "/hombre/calzado/sandalias/ojotas" },
              { label: "Sandalias Deportivas", href: "/hombre/calzado/sandalias/deportivas" },
            ]
          },
          {
            label: "Botas",
            href: "/hombre/calzado/botas",
            icon: "🥾",
            children: [
              { label: "Botinetas", href: "/hombre/calzado/botas/botinetas" },
              { label: "Botas de Trabajo", href: "/hombre/calzado/botas/trabajo" },
              { label: "Botas de Lluvia", href: "/hombre/calzado/botas/lluvia" },
            ]
          },
        ]
      },
      {
        label: "Temporada",
        href: "/hombre/temporada",
        children: [
          { label: "Verano", href: "/hombre/temporada/verano", icon: "☀️" },
          { label: "Invierno", href: "/hombre/temporada/invierno", icon: "❄️" },
          { label: "Atemporal", href: "/hombre/temporada/atemporal", icon: "🌍" },
        ]
      },
      {
        label: "Marcas Destacadas",
        href: "/hombre/marcas",
        children: [
          { label: "Nike", href: "/hombre/marcas/nike" },
          { label: "Adidas", href: "/hombre/marcas/adidas" },
          { label: "Puma", href: "/hombre/marcas/puma" },
          { label: "Vans", href: "/hombre/marcas/vans" },
          { label: "Converse", href: "/hombre/marcas/converse" },
        ]
      },
      {
        label: "Accesorios",
        href: "/hombre/accesorios",
        icon: "🎒",
        children: [
          { label: "Mochilas", href: "/hombre/accesorios/mochilas" },
          { label: "Bolsos", href: "/hombre/accesorios/bolsos" },
          { label: "Medias", href: "/hombre/accesorios/medias" },
          { label: "Gorros", href: "/hombre/accesorios/gorros" },
        ]
      },
      {
        label: "Indumentaria",
        href: "/hombre/indumentaria",
        icon: "👕",
        children: [
          { label: "Remeras", href: "/hombre/indumentaria/remeras" },
          { label: "Buzos", href: "/hombre/indumentaria/buzos" },
          { label: "Pantalones", href: "/hombre/indumentaria/pantalones" },
          { label: "Shorts", href: "/hombre/indumentaria/shorts" },
        ]
      },
    ]
  },
  {
    label: "Kids",
    href: "/kids",
    icon: "👶",
    children: [
      {
        label: "Calzado Niños",
        href: "/kids/ninos",
        children: [
          { label: "Deportivo", href: "/kids/ninos/deportivo", icon: "👟" },
          { label: "Urbano", href: "/kids/ninos/urbano", icon: "👞" },
          { label: "Sandalias", href: "/kids/ninos/sandalias", icon: "🩴" },
        ]
      },
      {
        label: "Calzado Niñas",
        href: "/kids/ninas",
        children: [
          { label: "Deportivo", href: "/kids/ninas/deportivo", icon: "👟" },
          { label: "Urbano", href: "/kids/ninas/urbano", icon: "👞" },
          { label: "Sandalias", href: "/kids/ninas/sandalias", icon: "🩴" },
        ]
      },
      {
        label: "Bebés",
        href: "/kids/bebes",
        children: [
          { label: "Primeros Pasos", href: "/kids/bebes/primeros-pasos" },
          { label: "Zapatitos", href: "/kids/bebes/zapatitos" },
        ]
      },
    ]
  },
  {
    label: "Marcas",
    href: "/marcas",
    icon: "⭐",
    children: [
      { label: "Nike", href: "/marcas/nike" },
      { label: "Adidas", href: "/marcas/adidas" },
      { label: "Puma", href: "/marcas/puma" },
      { label: "Vans", href: "/marcas/vans" },
      { label: "Converse", href: "/marcas/converse" },
      { label: "New Balance", href: "/marcas/new-balance" },
      { label: "Reebok", href: "/marcas/reebok" },
      { label: "Fila", href: "/marcas/fila" },
      { label: "Ver todas", href: "/marcas" },
    ]
  },
  {
    label: "Deportes",
    href: "/deportes",
    icon: "⚽",
    children: [
      { label: "Running", href: "/deportes/running", icon: "🏃" },
      { label: "Training", href: "/deportes/training", icon: "🏋️" },
      { label: "Fútbol", href: "/deportes/futbol", icon: "⚽" },
      { label: "Basket", href: "/deportes/basket", icon: "🏀" },
      { label: "Tenis", href: "/deportes/tenis", icon: "🎾" },
      { label: "Outdoor", href: "/deportes/outdoor", icon: "🥾" },
      { label: "Skate", href: "/deportes/skate", icon: "🛹" },
    ]
  },
  {
    label: "Ofertas",
    href: "/ofertas",
    icon: "🔥",
    badge: "HOT",
    children: [
      { label: "Hasta 30% OFF", href: "/ofertas/30" },
      { label: "Hasta 50% OFF", href: "/ofertas/50" },
      { label: "Últimas unidades", href: "/ofertas/ultimas" },
      { label: "Outlet", href: "/ofertas/outlet" },
    ]
  },
];
