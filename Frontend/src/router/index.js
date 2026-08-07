import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import CadastroView from '@/views/CadastroView.vue'
import TermosDeUsoView from '@/views/TermosDeUsoView.vue'
import PoliticaDePrivacidadeView from '@/views/PoliticaDePrivacidadeView.vue'
import HomeView from '@/views/HomeView.vue'
import SalvarView from '@/views/SalvarView.vue'
import ChatView from '@/views/ChatView.vue'
import EventosView from '@/views/EventosView.vue'
import ExplorarView from '@/views/ExplorarView.vue'
import CriarView from '@/views/CriarView.vue'
import UsuarioView from '@/views/UsuarioView.vue'
import AvisosView from '@/views/AvisosView.vue'
import RecSenhaView from '@/views/RecSenhaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: LoginView,
      meta: { ocultarHeader: true }
    },
    {
      path: '/cadastro',
      name: 'Cadastro',
      component: CadastroView,
      meta: { ocultarHeader: true }
    },
    {
      path: '/recuperar-senha',
      name: 'Recuperar Senha',
      component: RecSenhaView,
      meta: { ocultarHeader: true }
    },
    {
      path: '/termos-de-uso',
      name: 'Termos de uso',
      component: TermosDeUsoView,
      meta: { ocultarHeader: true }
    },
    {
      path: '/salvar',
      name: 'Salvar',
      component: SalvarView,
      meta: { requiresAuth: true }
    },
    {
      path: '/avisos',
      name: 'Avisos',
      component: AvisosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/criar/:id',
      name: 'Criar',
      component: CriarView,
      meta: { requiresAuth: true }
    },
    {
      path: '/usuario/:id',
      name: 'Usuário',
      component: UsuarioView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'Chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/eventos',
      name: 'Eventos',
      component: EventosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/explorar',
      name: 'Explorar',
      component: ExplorarView,
      meta: { requiresAuth: true }
    },
    {
      path: '/politica-de-privacidade',
      name: 'política de privacidade',
      component: PoliticaDePrivacidadeView,
      meta: { ocultarHeader: true }
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to) => {
  const usuarioLogado = localStorage.getItem('ifchat_token')

  if (to.meta.requiresAuth && !usuarioLogado) {
    alert('Acesso negado. Por favor, faça login primeiro!')
    return '/'
  }

  if ((to.path === '/' || to.path === '/cadastro') && usuarioLogado) {
    return '/home'
  }
});

export default router;
