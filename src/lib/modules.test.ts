import { describe, it, expect } from 'vitest'
import { isModuleVisible, MODULES } from './modules'

describe('isModuleVisible — regressão do vazamento de módulos Jean-only', () => {
  it('esconde módulo adminOnly de um usuário não-admin, mesmo que enabled_modules o contenha', () => {
    // Exatamente o bug real: a conta demo teve 'faturamento'/'sistemas'
    // parar em enabled_modules por engano. isModuleVisible precisa
    // ignorar isso quando isAdmin é false.
    expect(isModuleVisible('faturamento', true, ['faturamento'], false)).toBe(false)
    expect(isModuleVisible('sistemas', true, ['sistemas'], false)).toBe(false)
  })

  it('mostra módulo adminOnly pro admin independente de enabled_modules', () => {
    // Proposital: pro admin, isAdmin sozinho já basta — não depende de
    // enabled_modules, que é justamente o array que causou o vazamento
    // (e cuja perda de dados também fez Faturamento/Sistemas sumirem da
    // conta do Jean). Isso também blinda contra o mesmo bug se
    // enabled_modules for resetado de novo no futuro.
    expect(isModuleVisible('faturamento', true, ['faturamento'], true)).toBe(true)
    expect(isModuleVisible('faturamento', true, [], true)).toBe(true)
    expect(isModuleVisible('sistemas', true, [], true)).toBe(true)
  })

  it('módulos normais (não adminOnly) seguem só enabled_modules, isAdmin não importa', () => {
    expect(isModuleVisible('agenda', undefined, ['agenda'], false)).toBe(true)
    expect(isModuleVisible('agenda', undefined, [], true)).toBe(false)
  })

  it('faturamento e sistemas estão marcados adminOnly em MODULES', () => {
    expect(MODULES.find(m => m.id === 'faturamento')?.adminOnly).toBe(true)
    expect(MODULES.find(m => m.id === 'sistemas')?.adminOnly).toBe(true)
  })

  it('nenhum outro módulo é adminOnly (evita marcar algo por engano)', () => {
    const adminOnlyIds = MODULES.filter(m => m.adminOnly).map(m => m.id)
    expect(adminOnlyIds.sort()).toEqual(['faturamento', 'sistemas'])
  })
})
