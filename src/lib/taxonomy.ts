export interface Topic {
  id: string
  label: string
  pattern: RegExp
}

export const REASON_TOPICS: Topic[] = [
  { id: 'income', label: 'Ingresos insuficientes', pattern: /(dificultad|problema|situaci[oó]n)\w* econ[oó]mic|no (le )?alcanza|falta de (dinero|fondos|ingresos)|ingresos (bajos|insuficientes)|sin dinero/ },
  { id: 'job', label: 'Pérdida o cambio de empleo', pattern: /desemple|sin trabajo|perdi[oó] (el|su) (trabajo|empleo)|despid|qued[oó] sin (trabajo|empleo)|changas/ },
  { id: 'salary', label: 'Espera de cobro o sueldo', pattern: /(espera|hasta) (de )?cobrar|cuando cobre|sueldo|salario|aguinaldo|jubilaci[oó]n|cuando (le )?(paguen|deposit)|a fin de mes|principio de mes/ },
  { id: 'health', label: 'Salud o situación familiar', pattern: /salud|enferm|m[eé]dic|hospital|internad|operaci[oó]n|fallec|familiar/ },
  { id: 'debts', label: 'Múltiples compromisos', pattern: /otras deudas|varias deudas|otros (pagos|compromisos|gastos)|gastos imprevistos|imprevisto/ },
  { id: 'forgot', label: 'Olvido o descuido', pattern: /olvid|descuid|se le pas[oó]|no se dio cuenta/ },
  { id: 'dispute', label: 'Desconoce o disputa la deuda', pattern: /desconoc|no reconoce|no (sab[ií]a|estaba al tanto)|disput|error en|reclamo/ },
  { id: 'channel', label: 'Problemas con el canal de pago', pattern: /home ?banking|\bapp\b|no (pudo|puede) ingresar|problemas? (con|en) (el|la) (sistema|aplicaci[oó]n|p[aá]gina)|cajero/ },
]

export const OBJECTION_TOPICS: Topic[] = [
  { id: 'amount', label: 'Monto o cuota elevada', pattern: /monto|cuota(s)? (alta|elevad)|muy (alto|caro)|no puede pagar (el total|todo)|elevad/ },
  { id: 'interest', label: 'Intereses y recargos', pattern: /inter[eé]s|recargo|punitorio|costo financiero/ },
  { id: 'timing', label: 'Pide más plazo o fecha', pattern: /plazo|m[aá]s tiempo|fecha|pr[oó]xima semana|m[aá]s adelante|posterg/ },
  { id: 'paid', label: 'Afirma haber pagado', pattern: /ya (pag[oó]|abon[oó]|realiz[oó] el pago)|pag[oó] (ayer|hoy)|comprobante/ },
  { id: 'unaware', label: 'Desconoce la deuda', pattern: /desconoc|no reconoce|no sab[ií]a/ },
  { id: 'callback', label: 'Pide ser contactado luego', pattern: /llam(ar|e)(n)? (luego|m[aá]s tarde|despu[eé]s)|ocupad|no puede hablar|volver a (llamar|comunicar)/ },
  { id: 'trust', label: 'Desconfía del contacto', pattern: /desconf|estafa|fraude|verificar (la )?identidad|no (quiere|quiso) (dar|brindar) datos/ },
]

export const PRACTICE_TOPICS: Topic[] = [
  { id: 'alternatives', label: 'Ofrecer alternativas de pago', pattern: /alternativ|refinanci|plan(es)? de pago|opciones|pago parcial|cuota m[aá]s vencida/ },
  { id: 'commitment', label: 'Pactar fecha concreta', pattern: /fecha|para cu[aá]ndo|compromiso|promesa|pactar/ },
  { id: 'clarity', label: 'Informar deuda y días de mora', pattern: /d[ií]as de (mora|atraso)|monto|saldo|deuda vencida|importe/ },
  { id: 'empathy', label: 'Escucha empática', pattern: /emp[aá]t|entiendo|comprendo|escucha|amable|cordial/ },
  { id: 'identity', label: 'Validar identidad y titular', pattern: /titular|identific|se encuentra|confirmar (los )?datos|validar/ },
  { id: 'consequences', label: 'Explicar consecuencias de mora', pattern: /consecuencia|veraz|historial|bloqueo|intereses? punitorio|evitar (que|recargos)/ },
]

const EMPTY_ANSWER = /^\s*(no (se|hay|es posible|puede|existe)|el cliente no (manifiesta|plante[oó]|expres|menciona|indica)|la cliente no|ninguna|sin informaci)/

export function tagAnswer(answer: string | undefined | null, topics: Topic[]): string[] {
  if (!answer) return []
  const text = answer.toLowerCase()
  if (EMPTY_ANSWER.test(text)) return []
  return topics.filter((t) => t.pattern.test(text)).map((t) => t.id)
}

export function topicLabel(topics: Topic[], id: string): string {
  return topics.find((t) => t.id === id)?.label ?? id
}
