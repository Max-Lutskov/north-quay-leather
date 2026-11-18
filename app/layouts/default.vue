<template>
  <div class="page">
    <LayoutDemoBanner />
    <LayoutSiteHeader />
    <main id="main">
      <slot />
    </main>
    <LayoutSiteFooter />
    <CartDrawer />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1 0 auto;
}
</style>
