import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import LandingPage from "../views/LandingPage.vue";
import LoginPage from "../views/LoginPage.vue";
import RegisterPage from "../views/RegisterPage.vue";
import DriverPanel from "../views/DriverPanel.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "landing",
      component: LandingPage,
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
    },
    {
      path: "/driver-panel",
      name: "driver-panel",
      component: DriverPanel,
      // meta: { requiresAuth: true },
    },
    {
      path: "/restaurant/dashboard",
      component: () => import("../views/restaurants/HomePage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/restaurant",
      component: () => import("../views/restaurants/LoginPage.vue"),
    },
    {
      path: "/restaurant/orders",
      component: () => import("../views/restaurants/HistoryPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/restaurant/reports",
      component: () => import("../views/restaurants/OrderReportsPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/restaurant/customers",
      component: () => import("../views/restaurants/CustomersListPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/restaurant/register",
      component: () => import("../views/restaurants/RegisterPage.vue"),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  await authStore.checkSession();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
