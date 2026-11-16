package com.averonlabs.eshopverse.shell;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.StaggeredGridLayoutManager;

import com.averonlabs.eshopverse.R;
import com.averonlabs.eshopverse.auth.AuthViewModelFactory;
import com.averonlabs.eshopverse.auth.AvatarInitials;
import com.averonlabs.eshopverse.auth.SessionViewModel;
import com.averonlabs.eshopverse.auth.UserAvatarManager;
import com.averonlabs.eshopverse.catalog.CatalogListViewModel;
import com.averonlabs.eshopverse.catalog.CatalogViewModelFactory;
import com.averonlabs.eshopverse.catalog.CategoryIconResolver;
import com.averonlabs.eshopverse.catalog.CategoryViewModel;
import com.averonlabs.eshopverse.catalog.ProductGridAdapter;
import com.averonlabs.eshopverse.catalog.fragment.ProductDetailFragment;
import com.averonlabs.eshopverse.core.model.Category;
import com.averonlabs.eshopverse.core.model.ProductSummary;
import com.averonlabs.eshopverse.core.model.User;
import com.averonlabs.eshopverse.core.state.UiState;
import com.averonlabs.eshopverse.core.ui.ImageLoaderHelper;
import com.averonlabs.eshopverse.core.ui.SkeletonAdapter;
import com.averonlabs.eshopverse.core.ui.ThemeManager;
import com.averonlabs.eshopverse.databinding.FragmentHomeBinding;

import java.util.ArrayList;

import java.util.List;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private CatalogListViewModel catalogViewModel;
    private CategoryViewModel categoryViewModel;
    private SessionViewModel sessionViewModel;
    private ProductGridAdapter trendingCarouselAdapter;
    private ProductGridAdapter bestSellersAdapter;
    private ProductGridAdapter specialOffersAdapter;
    private ProductGridAdapter essentialsAdapter;

    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        CatalogViewModelFactory factory = new CatalogViewModelFactory(requireContext());
        catalogViewModel = new ViewModelProvider(this, factory).get(CatalogListViewModel.class);
        categoryViewModel = new ViewModelProvider(this, factory).get(CategoryViewModel.class);
        sessionViewModel = new ViewModelProvider(requireActivity(), new AuthViewModelFactory(requireContext()))
                .get(SessionViewModel.class);

        // XML clipToOutline only applies from API 31; set it on the view so
        // the avatar stays circular from API 25 upward.
        binding.btnAccountAvatar.setClipToOutline(true);

        setupSections();
        setupCategories();
        setupClickListeners();
        setupSwipeRefresh();
        updateThemeIcon();
        observeViewModel();
        sessionViewModel.getCurrentUser().observe(getViewLifecycleOwner(), this::renderAccountAvatar);
        sessionViewModel.getIsSignedIn().observe(getViewLifecycleOwner(), signedIn -> {
            if (!Boolean.TRUE.equals(signedIn)) {
                renderAccountAvatar(null);
            } else {
                User user = sessionViewModel.getCurrentUserValue();
                if (user == null && getContext() != null) {
                    user = UserAvatarManager.getCachedUser(requireContext());
                }
                renderAccountAvatar(user);
            }
        });

        if (catalogViewModel.hasData()) {
            renderProducts(catalogViewModel.getLoadedProducts());
        } else {
            catalogViewModel.loadFirstPage();
        }

        if (categoryViewModel.hasData()) {
            UiState<List<Category>> catState = categoryViewModel.getCategoriesState().getValue();
            if (catState != null && catState.getData() != null) {
                renderCategoryMoodCircles(catState.getData());
            }
        } else {
            categoryViewModel.loadCategories();
        }
    }

    private void updateThemeIcon() {
        if (binding == null || !isAdded()) return;
        boolean isDark = ThemeManager.isDarkMode(requireContext());
        binding.ivThemeToggleIcon.setImageResource(isDark ? R.drawable.ic_light_mode : R.drawable.ic_dark_mode);
        binding.btnThemeToggle.setContentDescription(getString(isDark ? R.string.theme_dark_desc : R.string.theme_light_desc));
    }

    /**
     * Renders the top bar profile circle:
     * - Shows the default account person silhouette icon (matching the bottom navigation bar) when user is not signed in.
     * - Shows the customer's photo when signed in and avatar is uploaded/cached.
     * - Shows clean initials fallback when signed in without a custom photo.
     */
    private void renderAccountAvatar(@Nullable User user) {
        if (binding == null || !isAdded()) return;

        binding.btnAccountAvatar.setContentDescription(getString(R.string.action_account));

        if (user == null) {
            // Check if user is cached in local storage and active session
            if (getContext() != null) {
                User cachedUser = UserAvatarManager.getCachedUser(requireContext());
                if (cachedUser != null && sessionViewModel.isSignedIn()) {
                    renderAccountAvatar(cachedUser);
                    return;
                }
            }
            // Guest state: show the exact default account silhouette matching bottom navigation bar
            binding.tvHomeAvatarInitials.setText("");
            binding.tvHomeAvatarInitials.setVisibility(View.GONE);
            binding.ivHomeAvatar.setVisibility(View.VISIBLE);
            int pad = getResources().getDimensionPixelSize(R.dimen.spacing_xs);
            binding.ivHomeAvatar.setPadding(pad, pad, pad, pad);
            binding.ivHomeAvatar.setImageResource(R.drawable.ic_account);
            binding.ivHomeAvatar.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.color_botanical_green));
            binding.ivHomeAvatar.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
            return;
        }

        // Signed-in user: restore normal padding
        binding.ivHomeAvatar.setPadding(0, 0, 0, 0);
        binding.ivHomeAvatar.setImageTintList(null);
        binding.ivHomeAvatar.setScaleType(ImageView.ScaleType.CENTER_CROP);

        String avatarUrl = user.getAvatarUrl();
        if ((avatarUrl == null || avatarUrl.trim().isEmpty()) && getContext() != null) {
            avatarUrl = UserAvatarManager.getAvatarPath(requireContext(), user.getId());
        }

        boolean hasAvatar = avatarUrl != null && !avatarUrl.trim().isEmpty();
        if (hasAvatar) {
            binding.tvHomeAvatarInitials.setText("");
            binding.tvHomeAvatarInitials.setVisibility(View.GONE);
            binding.ivHomeAvatar.setVisibility(View.VISIBLE);
            UserAvatarManager.loadAvatarInto(binding.ivHomeAvatar, avatarUrl);
        } else {
            binding.ivHomeAvatar.setVisibility(View.GONE);
            binding.tvHomeAvatarInitials.setVisibility(View.VISIBLE);
            binding.tvHomeAvatarInitials.setText(
                    AvatarInitials.from(user.getFirstName(), user.getLastName(), user.getEmail()));
        }
    }

    private void setupSections() {
        // Section 1: Trending This Week (Horizontal Carousel)
        trendingCarouselAdapter = new ProductGridAdapter(this::onProductClicked, true);

        // Section 2: Popular & Best Sellers (2-Column Grid)
        bestSellersAdapter = new ProductGridAdapter(this::onProductClicked, false);

        // Section 3: Special Offers (Horizontal Carousel)
        specialOffersAdapter = new ProductGridAdapter(this::onProductClicked, true);

        // Section 4: Curated Essentials (2-Column Grid)
        essentialsAdapter = new ProductGridAdapter(this::onProductClicked, false);

        // Attach skeleton adapters only when there is no existing data (cold launch)
        if (!catalogViewModel.hasData()) {
            binding.rvTrendingCarousel.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 4));
            binding.rvBestsellersGrid.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 4));
            binding.rvSpecialOffersCarousel.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 4));
            binding.rvEssentialsGrid.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 4));
        }
    }

    private void setupCategories() {
        LinearLayoutManager layoutManager = new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false);
        binding.rvHomeCategories.setLayoutManager(layoutManager);

        // Immediately attach 8 skeleton mood circles only if category data is not yet loaded
        if (!categoryViewModel.hasData()) {
            binding.rvHomeCategories.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_category_circle, 8));
        }

        categoryViewModel.getCategoriesState().observe(getViewLifecycleOwner(), state -> {
            if (state != null && state.isContent() && state.getData() != null) {
                renderCategoryMoodCircles(state.getData());
            }
        });
    }

    private void renderCategoryMoodCircles(@NonNull List<Category> categories) {
        binding.rvHomeCategories.setAdapter(new RecyclerView.Adapter<RecyclerView.ViewHolder>() {
            @NonNull
            @Override
            public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
                View view = LayoutInflater.from(parent.getContext())
                        .inflate(R.layout.item_category_mood_circle, parent, false);
                return new RecyclerView.ViewHolder(view) {};
            }

            @Override
            public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
                ImageView iconView = holder.itemView.findViewById(R.id.iv_category_icon);
                TextView nameView = holder.itemView.findViewById(R.id.tv_category_name);

                if (position == 0) {
                    nameView.setText(R.string.catalog_category_all);
                    iconView.setImageResource(R.drawable.ic_category_all);
                    holder.itemView.setOnClickListener(v -> navigateToExploreCategory(-1, getString(R.string.catalog_category_all)));
                } else {
                    Category category = categories.get(position - 1);
                    nameView.setText(CategoryIconResolver.getStreamlinedName(category.getName()));
                    iconView.setImageResource(CategoryIconResolver.getCategoryIcon(category.getName()));
                    holder.itemView.setOnClickListener(v -> navigateToExploreCategory(category.getId(), category.getName()));
                }
            }

            @Override
            public int getItemCount() {
                return categories.size() + 1;
            }
        });
    }

    private int getCategoryIcon(String categoryName) {
        return CategoryIconResolver.getCategoryIcon(categoryName);
    }

    private void setupClickListeners() {
        // Pill search bar: navigate to Explore
        binding.barPillSearch.setOnClickListener(v -> navigateToExplore());

        // Hero CTA button: navigate to Explore
        binding.btnHeroCta.setOnClickListener(v -> navigateToExplore());

        // Section See All buttons: navigate to Explore
        binding.btnTrendingViewAll.setOnClickListener(v -> navigateToExplore());
        binding.btnBestsellersViewAll.setOnClickListener(v -> navigateToExplore());
        binding.btnSpecialOffersViewAll.setOnClickListener(v -> navigateToExplore());
        binding.btnEssentialsViewAll.setOnClickListener(v -> navigateToExplore());

        // Account avatar: open the Account destination
        binding.btnAccountAvatar.setOnClickListener(v -> {
            try {
                Navigation.findNavController(requireView()).navigate(R.id.accountFragment);
            } catch (Exception ignored) {
                // Navigation is not ready; leave the current screen untouched.
            }
        });

        // Theme toggle button in circular frame
        binding.btnThemeToggle.setOnClickListener(v -> {
            ThemeManager.toggleTheme(requireContext());
            updateThemeIcon();
        });
    }

    private void setupSwipeRefresh() {
        binding.swipeRefreshHome.setColorSchemeResources(R.color.color_botanical_green);
        binding.swipeRefreshHome.setOnRefreshListener(() -> {
            catalogViewModel.reload();
            categoryViewModel.reload();
        });
    }

    private void observeViewModel() {
        catalogViewModel.getProductsState().observe(getViewLifecycleOwner(), state -> {
            if (binding != null && state != null && state.getStatus() != UiState.Status.LOADING) {
                binding.swipeRefreshHome.setRefreshing(false);
            }
            if (state != null && state.getStatus() == UiState.Status.CONTENT && state.getData() != null) {
                renderProducts(state.getData());
            }
        });
    }

    private void renderProducts(@NonNull List<ProductSummary> all) {
        if (binding == null || all.isEmpty()) {
            return;
        }
        int total = all.size();
        if (binding.rvTrendingCarousel.getAdapter() != trendingCarouselAdapter) {
            binding.rvTrendingCarousel.setAdapter(trendingCarouselAdapter);
        }
        trendingCarouselAdapter.submitList(all.subList(0, Math.min(8, total)));

        if (binding.rvBestsellersGrid.getAdapter() != bestSellersAdapter) {
            binding.rvBestsellersGrid.setAdapter(bestSellersAdapter);
        }
        if (total > 8) {
            bestSellersAdapter.submitList(all.subList(8, Math.min(12, total)));
        } else {
            bestSellersAdapter.submitList(all.subList(0, Math.min(4, total)));
        }

        if (binding.rvSpecialOffersCarousel.getAdapter() != specialOffersAdapter) {
            binding.rvSpecialOffersCarousel.setAdapter(specialOffersAdapter);
        }
        if (total > 12) {
            specialOffersAdapter.submitList(all.subList(12, Math.min(20, total)));
        } else {
            specialOffersAdapter.submitList(all.subList(Math.max(0, total - 4), total));
        }

        if (binding.rvEssentialsGrid.getAdapter() != essentialsAdapter) {
            binding.rvEssentialsGrid.setAdapter(essentialsAdapter);
        }
        if (total > 20) {
            essentialsAdapter.submitList(all.subList(20, Math.min(24, total)));
        } else {
            essentialsAdapter.submitList(all.subList(0, Math.min(4, total)));
        }

        // Proactive background prefetching for top section product cards
        List<String> preloadUrls = new ArrayList<>();
        int preloadCount = Math.min(12, total);
        for (int i = 0; i < preloadCount; i++) {
            ProductSummary p = all.get(i);
            if (p != null && p.getImageUrl() != null && !p.getImageUrl().trim().isEmpty()) {
                preloadUrls.add(p.getImageUrl());
            }
        }
        ImageLoaderHelper.preloadBatch(getContext(), preloadUrls);
    }

    private void onProductClicked(@NonNull ProductSummary product) {
        if (!isAdded()) {
            return;
        }
        Bundle args = ProductDetailFragment.createArgs(product);
        try {
            Navigation.findNavController(requireView()).navigate(
                    R.id.action_homeFragment_to_productDetailFragment,
                    args
            );
        } catch (Exception e) {
            try {
                Navigation.findNavController(requireView()).navigate(R.id.nav_catalog, args);
            } catch (Exception ignored) {
            }
        }
    }

    private void navigateToExplore() {
        navigateToExploreCategory(-1, null);
    }

    private void navigateToExploreCategory(long categoryId, @Nullable String categoryName) {
        if (!isAdded()) {
            return;
        }
        Bundle args = new Bundle();
        if (categoryId != -1) {
            args.putLong("categoryId", categoryId);
            args.putString("categoryName", categoryName);
        }
        Navigation.findNavController(requireView()).navigate(
                R.id.action_homeFragment_to_exploreFragment,
                args
        );
    }

    @Override
    public void onResume() {
        super.onResume();
        if (trendingCarouselAdapter != null) trendingCarouselAdapter.notifyDataSetChanged();
        if (bestSellersAdapter != null) bestSellersAdapter.notifyDataSetChanged();
        if (specialOffersAdapter != null) specialOffersAdapter.notifyDataSetChanged();
        if (essentialsAdapter != null) essentialsAdapter.notifyDataSetChanged();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
