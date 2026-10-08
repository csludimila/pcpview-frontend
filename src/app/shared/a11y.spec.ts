import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import * as axe from 'axe-core';

import { AppComponent } from '../app';
import { LoginComponent } from '../components/auth/login/login';
import { RegisterComponent } from '../components/auth/register/register';
import { OpFormComponent } from '../components/op-form/op-form';
import { OrderFormComponent } from '../components/order-form/order-form';
import { ProductFormComponent } from '../components/product-form/product-form';
import { MachineListComponent } from '../components/machine-list/machine-list';

describe('Suíte de Testes Automatizados de Acessibilidade (WCAG 2.1 AA)', () => {
  const axeOptions: axe.RunOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
    }
  };

  const executarValidacaoAxe = async (fixture: ComponentFixture<any>): Promise<axe.AxeResults> => {
    // 1. Anexa o componente ao DOM do browser para o axe inspecionar nós e cores reais
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    // 2. Pequena pausa assíncrona sem depender de whenStable() para não travar nos intervals
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();

    try {
      return await axe.run(fixture.nativeElement, axeOptions);
    } finally {
      // 3. Limpeza do nó após a análise
      if (document.body.contains(fixture.nativeElement)) {
        document.body.removeChild(fixture.nativeElement);
      }
    }
  };

  const formatarViolacoes = (violacoes: axe.Result[]): string => {
    if (!violacoes.length) return '';
    return violacoes
      .map(
        (v) =>
          `\n[${v.impact?.toUpperCase()}] ${v.help} (${v.id})\n` +
          `  Ajuda: ${v.helpUrl}\n` +
          `  Nós afetados:\n` +
          v.nodes.map((n) => `    - ${n.target.join(' ')}: ${n.failureSummary}`).join('\n')
      )
      .join('\n');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        LoginComponent,
        RegisterComponent,
        OpFormComponent,
        OrderFormComponent,
        ProductFormComponent,
        MachineListComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('AppComponent (Header e Navegação Global) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('LoginComponent não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('OpFormComponent (Operação / IHM) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(OpFormComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('OrderFormComponent (Planejamento de Produção) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('ProductFormComponent (Catálogo de Produtos) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('MachineListComponent (Gestão de Máquinas) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });

  it('RegisterComponent (Gestão e Cadastro de Usuários) não deve apresentar violações de acessibilidade', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const resultado = await executarValidacaoAxe(fixture);
    fixture.destroy();

    expect(resultado.violations.length)
      .withContext(formatarViolacoes(resultado.violations))
      .toBe(0);
  });
});