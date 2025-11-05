/// <reference types="vitest" />



describe('useSearchLoading', () => {
  it('falls back to local state when no provider exists', () => {
    const local = useSearchLoading();
    expect(local.isSearching.value).toBe(false);
    local.setSearching(true);
    expect(local.isSearching.value).toBe(true);
  });

  it('shares state when a provider is used', () => {
    const Consumer = defineComponent({
      name: 'SearchLoadingConsumer',
      setup(_, { expose }) {
        const ctx = useSearchLoading();
        expose({ ctx });
        return () => null;
      },
    });

    const Provider = defineComponent({
      name: 'SearchLoadingProviderTest',
      setup(_, { expose }) {
        const provided = provideSearchLoading();
        expose({ provided });
        return () => h(Consumer);
      },
    });

    const wrapper = mount(Provider);
    const providerExposed = (wrapper.vm.$ as any).exposed as {
      provided: ReturnType<typeof provideSearchLoading>;
    };
    const provided = providerExposed.provided;

    const consumerVm = wrapper.findComponent(Consumer).vm as any;
    const consumerCtx = (consumerVm.$.exposed as { ctx: ReturnType<typeof useSearchLoading> }).ctx;

    provided.setSearching(true);
    expect(provided.isSearching.value).toBe(true);
    expect(consumerCtx.isSearching.value).toBe(true);

    consumerCtx.setSearching(false);
    expect(consumerCtx.isSearching.value).toBe(false);
    expect(provided.isSearching.value).toBe(false);
  });
});
