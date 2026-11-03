import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app';
import { GlobalErrorService } from './shared/global-error.service';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should hide menu on login route by default', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.header')).toBeNull();
  });

  it('nao deve exibir a opcao de produtos no menu', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.mostrarMenu = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/produtos"]')).toBeNull();
    expect(compiled.querySelector('nav')?.textContent).not.toContain('Produtos');
  });

  it('deve oferecer atalho para o conteudo principal', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(compiled.querySelectorAll('main').length).toBe(1);
    expect(compiled.querySelector('main')?.id).toBe('main-content');
    expect(compiled.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('should show and close a global error message', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const globalErrorService = TestBed.inject(GlobalErrorService);

    globalErrorService.mostrar('Erro de teste');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.global-error')?.textContent).toContain('Erro de teste');

    fixture.componentInstance.limparErroGlobal();
    fixture.detectChanges();

    expect(compiled.querySelector('.global-error')).toBeNull();
  });
});
