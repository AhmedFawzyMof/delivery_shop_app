import { createRouter, createWebHistory } from "vue-router";
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
    },
    {
      path: "/restaurant/dashboard",
      component: () => import("../views/restaurants/HomePage.vue"),
    },
    {
      path: "/restaurant",
      component: () => import("../views/restaurants/LoginPage.vue"),
    },
    {
      path: "/restaurant/orders",
      component: () => import("../views/restaurants/HistoryPage.vue"),
    },
    {
      path: "/restaurant/reports",
      component: () => import("../views/restaurants/OrderReportsPage.vue"),
    },
    {
      path: "/restaurant/customers",
      component: () => import("../views/restaurants/CustomersListPage.vue"),
    },
    {
      path: "/restaurant/register",
      component: () => import("../views/restaurants/RegisterPage.vue"),
    },
  ],
});

export default router;
