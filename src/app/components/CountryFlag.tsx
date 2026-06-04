// Mapeo completo de países → códigos ISO 3166-1 alpha-2 para flagcdn.com
// Fuente: worldcup.json/2026/worldcup.teams.json
// Formato: https://flagcdn.com/{code}.svg
// Subdivisiones soportadas: gb-eng, gb-wls, gb-sct
export const COUNTRY_CODES: Record<string, string> = {
  // ── Grupo A ──
  'México':              'mx',
  'Sudáfrica':           'za',
  'Corea del Sur':       'kr',
  'República Checa':     'cz',
  // ── Grupo B ──
  'Canadá':              'ca',
  'Bosnia & Herzegovina':'ba',
  'Catar':               'qa',
  'Suiza':               'ch',
  // ── Grupo C ──
  'Brasil':              'br',
  'Marruecos':           'ma',
  'Haití':               'ht',
  'Escocia':             'gb-sct',
  // ── Grupo D ──
  'USA':                 'us',
  'Paraguay':            'py',
  'Australia':           'au',
  'Turquía':             'tr',
  // ── Grupo E ──
  'Alemania':            'de',
  'Curazao':             'cw',
  'Costa de Marfil':     'ci',
  'Ecuador':             'ec',
  // ── Grupo F ──
  'Países Bajos':        'nl',
  'Japón':               'jp',
  'Suecia':              'se',
  'Túnez':               'tn',
  // ── Grupo G ──
  'Bélgica':             'be',
  'Egipto':              'eg',
  'Irán':                'ir',
  'Nueva Zelanda':       'nz',
  // ── Grupo H ──
  'España':              'es',
  'Cabo Verde':          'cv',
  'Arabia Saudita':      'sa',
  'Uruguay':             'uy',
  // ── Grupo I ──
  'Francia':             'fr',
  'Senegal':             'sn',
  'Iraq':                'iq',
  'Noruega':             'no',
  // ── Grupo J ──
  'Argentina':           'ar',
  'Argelia':             'dz',
  'Austria':             'at',
  'Jordania':            'jo',
  // ── Grupo K ──
  'Portugal':            'pt',
  'DR Congo':            'cd',
  'Uzbekistán':          'uz',
  'Colombia':            'co',
  // ── Grupo L ──
  'Inglaterra':          'gb-eng',
  'Croacia':             'hr',
  'Ghana':               'gh',
  'Panamá':              'pa',
  // ── Aliases y variantes en inglés ──
  'Estados Unidos':      'us',
  'Gales':               'gb-wls',
  'Bosnia':              'ba',
  'Bosnia-Herzegovina':  'ba',
  'Polonia':             'pl',
  'Nigeria':             'ng',
  'Dinamarca':           'dk',
  'Rep. Checa':          'cz',
  'Czechia':             'cz',
  'Korea Republic':      'kr',
  'South Korea':         'kr',
  'Ivory Coast':         'ci',
  'Netherlands':         'nl',
  'Qatar':               'qa',
  'Switzerland':         'ch',
  'Morocco':             'ma',
  'Scotland':            'gb-sct',
  'Belgium':             'be',
  'Iran':                'ir',
  'New Zealand':         'nz',
  'Cape Verde':          'cv',
  'Saudi Arabia':        'sa',
  'Norway':              'no',
  'Algeria':             'dz',
  'Jordan':              'jo',
  'Uzbekistan':          'uz',
  'England':             'gb-eng',
  'Croatia':             'hr',
  'Germany':             'de',
  'Sweden':              'se',
  'Tunisia':             'tn',
  'Turkey':              'tr',
  'France':              'fr',
  // ── Otros países del mundo ──
  'Chile':               'cl',
  'Perú':                'pe',
  'Italia':              'it',
  'Bolivia':             'bo',
  'Venezuela':           've',
  'Honduras':            'hn',
  'Jamaica':             'jm',
  'Camerún':             'cm',
  'Mali':                'ml',
  'Grecia':              'gr',
  'Hungría':             'hu',
  'Rumanía':             'ro',
  'Eslovaquia':          'sk',
  'Serbia':              'rs',
  'Ucrania':             'ua',
  'Eslovenia':           'si',
  'Albania':             'al',
  'Kosovo':              'xk',
  'Irlanda del Norte':   'gb-nir',
  'República de Irlanda':'ie',
  'Macedonia del Norte': 'mk',
  'Montenegro':          'me',
  'Georgia':             'ge',
  'Israel':              'il',
  'Finlandia':           'fi',
  'Kazajistán':          'kz',
  'Azerbaiyán':          'az',
  'Bielorrusia':         'by',
  'Armenia':             'am',
  'Costa Rica':          'cr',
  'Guatemala':           'gt',
  'El Salvador':         'sv',
  'Nicaragua':           'ni',
  'Belice':              'bz',
  'Cuba':                'cu',
  'Trinidad y Tobago':   'tt',
  'Barbados':            'bb',
  'Bahamas':             'bs',
  'República Dominicana':'do',
  'Kenia':               'ke',
  'Tanzania':            'tz',
  'Uganda':              'ug',
  'Etiopía':             'et',
  'Zimbabue':            'zw',
  'Zambia':              'zm',
  'Mozambique':          'mz',
  'Namibia':             'na',
  'Botswana':            'bw',
  'Angola':              'ao',
  'Burkina Faso':        'bf',
  'Somalia':             'so',
  'Libia':               'ly',
  'Sudán':               'sd',
  'Gabón':               'ga',
  'Congo':               'cg',
  'Ruanda':              'rw',
  'Mauritania':          'mr',
  'Benín':               'bj',
  'Togo':                'tg',
  'Guinea-Bisáu':        'gw',
  'Sierra Leona':        'sl',
  'Liberia':             'lr',
  'Gambia':              'gm',
  'Guinea Ecuatorial':   'gq',
  'Santo Tomé y Príncipe':'st',
  'Lesoto':              'ls',
  'Suazilandia':         'sz',
  'Corea del Norte':     'kp',
  'Vietnam':             'vn',
  'Tailandia':           'th',
  'Malasia':             'my',
  'Indonesia':           'id',
  'Filipinas':           'ph',
  'Singapur':            'sg',
  'Siria':               'sy',
  'Líbano':              'lb',
  'Kuwait':              'kw',
  'Bahréin':             'bh',
  'Emiratos Árabes Unidos': 'ae',
  'Omán':                'om',
  'Yemen':               'ye',
  'Palestina':           'ps',
  'Afganistán':          'af',
  'Pakistán':            'pk',
  'Bangladesh':          'bd',
  'Sri Lanka':           'lk',
  'Myanmar':             'mm',
  'Camboya':             'kh',
  'Laos':                'la',
  'Mongolia':            'mn',
  'Nepal':               'np',
  'Bután':               'bt',
  'China':               'cn',
  'Taiwán':              'tw',
  'India':               'in',
};

interface CountryFlagProps {
  country: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function CountryFlag({ country, size = 'md', className = '' }: CountryFlagProps) {
  const code = COUNTRY_CODES[country];

  const sizes = {
    xs: { div: 'w-5 h-5', text: 'text-[8px]' },
    sm: { div: 'w-7 h-7', text: 'text-[9px]' },
    md: { div: 'w-10 h-10', text: 'text-xs' },
    lg: { div: 'w-14 h-14', text: 'text-sm' },
    xl: { div: 'w-20 h-20', text: 'text-base' },
  };

  const { div: sizeClass, text: textSize } = sizes[size];

  if (!code) {
    // Fallback con iniciales
    return (
      <div
        className={`${sizeClass} ${className} rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0`}
        style={{ background: 'linear-gradient(135deg, var(--mundial-purple), var(--mundial-turquoise))' }}
      >
        <span className={`${textSize} font-bold text-white`}>{getInitials(country)}</span>
      </div>
    );
  }

  const flagUrl = `https://flagcdn.com/${code}.svg`;

  return (
    <div
      className={`${sizeClass} ${className} rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-md relative bg-gray-50 flex-shrink-0`}
    >
      <img
        src={flagUrl}
        alt={country}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold ${textSize}" style="background:linear-gradient(135deg,var(--mundial-purple),var(--mundial-turquoise));color:white">${getInitials(country)}</div>`;
          }
        }}
      />
    </div>
  );
}

function getInitials(country: string): string {
  return country.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
