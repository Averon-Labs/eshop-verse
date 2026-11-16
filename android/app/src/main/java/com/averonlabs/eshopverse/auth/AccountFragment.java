package com.averonlabs.eshopverse.auth;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.navigation.NavController;
import androidx.navigation.fragment.NavHostFragment;

import com.averonlabs.eshopverse.R;
import com.averonlabs.eshopverse.catalog.FavoritesRepository;
import com.averonlabs.eshopverse.core.model.AuthSession;
import com.averonlabs.eshopverse.core.model.ProductSummary;
import com.averonlabs.eshopverse.core.model.User;
import com.averonlabs.eshopverse.core.model.UserRole;
import com.averonlabs.eshopverse.core.state.UiState;
import com.averonlabs.eshopverse.core.ui.ImageLoaderHelper;
import com.averonlabs.eshopverse.core.ui.ThemeManager;
import com.averonlabs.eshopverse.core.ui.view.StateContainerView;
import com.averonlabs.eshopverse.databinding.FragmentAccountBinding;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.snackbar.Snackbar;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Screen M-07 / M-17: Customer Account & Profile.
 * Displays customer profile when signed in, or direct sign-in form for guests,
 * supporting instant login, registration navigation, name updates, and sign-out.
 */
public class AccountFragment extends Fragment {

    private FragmentAccountBinding binding;
    private AuthViewModel authViewModel;
    private SessionViewModel sessionViewModel;
    private GoogleAuthManager googleAuthManager;
    private ActivityResultLauncher<PickVisualMediaRequest> pickAvatarLauncher;
    private ActivityResultLauncher<Void> takePictureLauncher;
    private ExecutorService avatarReader;
    private int currentUserId = -1;
    private String pendingGoogleAvatarUrl = null;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        takePictureLauncher = registerForActivityResult(
                new ActivityResultContracts.TakePicturePreview(),
                bitmap -> {
                    if (bitmap != null && getContext() != null && binding != null) {
                        // Optimistic UI: Immediately render thumbnail on the avatar
                        binding.ivProfileAvatar.setImageBitmap(bitmap);
                        binding.tvAvatarInitials.setVisibility(View.GONE);
                        setAvatarBusy(true);

                        Context appContext = requireContext().getApplicationContext();
                        if (avatarReader != null) {
                            avatarReader.execute(() -> {
                                byte[] bytes = AvatarImageCompressor.compressBitmap(bitmap);
                                ContextCompat.getMainExecutor(appContext).execute(() -> {
                                    if (AvatarImageValidator.isWithinSizeLimit(bytes.length)) {
                                        authViewModel.uploadAvatar(bytes, "image/jpeg");
                                    } else {
                                        setAvatarBusy(false);
                                        User currentUser = sessionViewModel.getCurrentUser().getValue();
                                        if (currentUser != null) renderAvatar(currentUser);
                                        showAnchoredSnackbar(R.string.auth_error_avatar_too_large);
                                    }
                                });
                            });
                        }
                    }
                }
        );
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentAccountBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        AuthViewModelFactory factory = new AuthViewModelFactory(requireContext());
        authViewModel = new ViewModelProvider(this, factory).get(AuthViewModel.class);
        sessionViewModel = new ViewModelProvider(requireActivity(), factory).get(SessionViewModel.class);
        googleAuthManager = new GoogleAuthManager(requireContext());
        avatarReader = Executors.newSingleThreadExecutor();

        binding.stateContainer.setContentView(binding.scrollContent);

        // clipToOutline as an XML attribute only applies from API 31; the
        // programmatic view call works on every supported API level.
        binding.avatarContainer.setClipToOutline(true);

        registerAvatarPicker();
        setupTextWatchers();
        setupClickListeners();
        setupFavoritesSection();
        setupThemeSection();
        observeViewModels();

        requireActivity().getOnBackPressedDispatcher().addCallback(getViewLifecycleOwner(), new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (!sessionViewModel.isSignedIn()) {
                    NavController navController = NavHostFragment.findNavController(AccountFragment.this);
                    boolean popped = navController.popBackStack(R.id.homeFragment, false);
                    if (!popped) {
                        navController.navigate(R.id.homeFragment);
                    }
                } else {
                    setEnabled(false);
                    requireActivity().getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void setupTextWatchers() {
        TextWatcher profileErrorWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (binding != null) {
                    binding.tilFirstName.setError(null);
                    binding.tilLastName.setError(null);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        };

        binding.etFirstName.addTextChangedListener(profileErrorWatcher);
        binding.etLastName.addTextChangedListener(profileErrorWatcher);

        TextWatcher guestErrorWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (binding != null) {
                    binding.tilGuestEmail.setError(null);
                    binding.tilGuestPassword.setError(null);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        };

        binding.etGuestEmail.addTextChangedListener(guestErrorWatcher);
        binding.etGuestPassword.addTextChangedListener(guestErrorWatcher);
    }

    private void setupClickListeners() {
        View.OnClickListener openPicker = v -> {
            if (currentUserId > 0) {
                showAvatarPickerDialog();
            }
        };
        binding.avatarContainer.setOnClickListener(openPicker);
        binding.btnEditAvatarBadge.setOnClickListener(openPicker);

        binding.btnSaveProfile.setOnClickListener(v -> {
            String firstName = binding.etFirstName.getText() != null ? binding.etFirstName.getText().toString() : "";
            String lastName = binding.etLastName.getText() != null ? binding.etLastName.getText().toString() : "";
            authViewModel.updateProfile(firstName, lastName);
        });

        binding.btnSignOut.setOnClickListener(v -> {
            UserAvatarManager.clearCachedUser(requireContext());
            sessionViewModel.signOut();
            currentUserId = -1;
            pendingGoogleAvatarUrl = null;
            // Forget the Google account picked during sign-in so the next
            // sign-in shows the account picker again instead of auto-selecting it.
            googleAuthManager.clearCredentialState(
                    ContextCompat.getMainExecutor(requireContext()), null);
        });

        binding.btnGuestSignIn.setOnClickListener(v -> {
            String email = binding.etGuestEmail.getText() != null ? binding.etGuestEmail.getText().toString() : "";
            String password = binding.etGuestPassword.getText() != null ? binding.etGuestPassword.getText().toString() : "";
            authViewModel.login(email, password);
        });

        binding.btnGuestGoogleSignIn.setOnClickListener(v -> {
            if (getActivity() == null) return;
            googleAuthManager.startSignIn(requireActivity(), new GoogleAuthManager.GoogleAuthCallback() {
                @Override
                public void onSuccess(@NonNull String idToken) {
                    pendingGoogleAvatarUrl = UserAvatarManager.extractPictureUrlFromIdToken(idToken);
                    authViewModel.loginWithGoogle(idToken);
                }

                @Override
                public void onCancelled() {
                    // User dismissed credential picker
                }

                @Override
                public void onError(@NonNull GoogleAuthManager.GoogleAuthFailure failure) {
                    showAnchoredSnackbar(GoogleAuthManager.messageResFor(failure));
                }
            });
        });

        binding.btnGuestForgotPassword.setOnClickListener(v -> {
            try {
                NavController navController = NavHostFragment.findNavController(this);
                navController.navigate(R.id.action_accountFragment_to_requestPasswordResetFragment);
            } catch (Exception e) {
                try {
                    NavHostFragment.findNavController(this).navigate(R.id.requestPasswordResetFragment);
                } catch (Exception ignored) {}
            }
        });

        binding.btnGuestRegister.setOnClickListener(v -> {
            try {
                NavController navController = NavHostFragment.findNavController(this);
                Bundle args = new Bundle();
                args.putInt("returnToNavId", R.id.accountFragment);
                navController.navigate(R.id.action_accountFragment_to_registerFragment, args);
            } catch (Exception e) {
                try {
                    NavHostFragment.findNavController(this).navigate(R.id.registerFragment);
                } catch (Exception ignored) {}
            }
        });
        if (binding.btnBack != null) {
            binding.btnBack.setOnClickListener(v -> {
                NavController navController = NavHostFragment.findNavController(this);
                boolean popped = navController.popBackStack(R.id.homeFragment, false);
                if (!popped) {
                    navController.navigate(R.id.homeFragment);
                }
            });
        }
    }

    private void showAnchoredSnackbar(@StringRes int messageRes) {
        if (!isAdded() || getView() == null) return;
        Snackbar snackbar = Snackbar.make(binding.getRoot(), messageRes, Snackbar.LENGTH_LONG);
        if (getActivity() != null) {
            View bottomNav = getActivity().findViewById(R.id.card_bottom_nav);
            if (bottomNav != null && bottomNav.getVisibility() == View.VISIBLE) {
                snackbar.setAnchorView(bottomNav);
            }
        }
        snackbar.show();
    }

    private void showAnchoredSnackbar(@NonNull String message) {
        if (!isAdded() || getView() == null) return;
        Snackbar snackbar = Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_LONG);
        if (getActivity() != null) {
            View bottomNav = getActivity().findViewById(R.id.card_bottom_nav);
            if (bottomNav != null && bottomNav.getVisibility() == View.VISIBLE) {
                snackbar.setAnchorView(bottomNav);
            }
        }
        snackbar.show();
    }

    private void observeViewModels() {
        sessionViewModel.getIsSignedIn().observe(getViewLifecycleOwner(), isSignedIn -> {
            if (binding == null) return;
            boolean signedIn = Boolean.TRUE.equals(isSignedIn);
            binding.layoutSignedIn.setVisibility(signedIn ? View.VISIBLE : View.GONE);
            binding.layoutSignedInActions.setVisibility(signedIn ? View.VISIBLE : View.GONE);
            binding.layoutGuestState.setVisibility(signedIn ? View.GONE : View.VISIBLE);
            binding.cardThemeToggle.setVisibility(signedIn ? View.VISIBLE : View.GONE);
            binding.cardFavoritesNav.setVisibility(signedIn ? View.VISIBLE : View.GONE);
            binding.btnBack.setVisibility(signedIn ? View.GONE : View.VISIBLE);
            binding.tvAccountTitle.setText(signedIn ? R.string.auth_account_title : R.string.auth_sign_in_title);

            // Update favorites badge according to auth status
            if (signedIn) {
                int count = FavoritesRepository.getInstance(requireContext()).getFavoritesCount();
                binding.tvFavoritesCountBadge.setText(count + " " + (count == 1 ? "item" : "items"));

                // 0ms Instant Render: Load cached user immediately without blocking network
                if (sessionViewModel.getCurrentUserValue() == null) {
                    User cachedUser = UserAvatarManager.getCachedUser(requireContext());
                    if (cachedUser != null) {
                        sessionViewModel.setCurrentUser(cachedUser);
                    }
                }

                // Stale-While-Revalidate: Check 30-minute TTL to preserve battery & data
                if (UserAvatarManager.shouldRevalidateProfile(requireContext())) {
                    sessionViewModel.refreshProfile(new AuthCallback<User>() {
                        @Override
                        public void onSuccess(User freshUser) {
                            if (isAdded() && getContext() != null && freshUser != null) {
                                UserAvatarManager.saveCachedUser(requireContext(), freshUser);
                            }
                        }

                        @Override
                        public void onError(Throwable t) {
                            // Non-fatal; stale cached profile remains active
                        }
                    });
                }
            } else {
                UserAvatarManager.clearCachedUser(requireContext());
            }
        });

        sessionViewModel.getCurrentUser().observe(getViewLifecycleOwner(), user -> {
            if (binding == null || user == null) return;
            currentUserId = user.getId();
            UserAvatarManager.saveCachedUser(requireContext(), user);
            String fullName = user.getFirstName() + " " + user.getLastName();
            binding.tvUserName.setText(fullName.trim());
            binding.tvUserEmail.setText(user.getEmail());
            binding.tvUserRole.setText(user.getRole() == UserRole.ADMIN
                    ? R.string.auth_role_admin
                    : R.string.auth_role_customer);
            renderAvatar(user);

            // Update edit fields if currently empty
            if (binding.etFirstName.getText() == null || binding.etFirstName.getText().length() == 0) {
                binding.etFirstName.setText(user.getFirstName());
            }
            if (binding.etLastName.getText() == null || binding.etLastName.getText().length() == 0) {
                binding.etLastName.setText(user.getLastName());
            }

            // Avatar loading and Google photo integration fallback
            if (user.getAvatarUrl() == null || user.getAvatarUrl().trim().isEmpty()) {
                String avatarPath = UserAvatarManager.getAvatarPath(requireContext(), user.getId());
                if (avatarPath == null && pendingGoogleAvatarUrl != null) {
                    UserAvatarManager.saveGoogleAvatarUrl(requireContext(), user.getId(), pendingGoogleAvatarUrl);
                    avatarPath = pendingGoogleAvatarUrl;
                    pendingGoogleAvatarUrl = null;
                }
                if (avatarPath != null) {
                    UserAvatarManager.loadAvatarInto(binding.ivProfileAvatar, avatarPath);
                }
            }
        });

        authViewModel.getFirstNameErrorRes().observe(getViewLifecycleOwner(), resId -> {
            if (binding != null) binding.tilFirstName.setError(resId != null ? getString(resId) : null);
        });

        authViewModel.getLastNameErrorRes().observe(getViewLifecycleOwner(), resId -> {
            if (binding != null) binding.tilLastName.setError(resId != null ? getString(resId) : null);
        });

        authViewModel.getEmailErrorRes().observe(getViewLifecycleOwner(), resId -> {
            if (binding != null) binding.tilGuestEmail.setError(resId != null ? getString(resId) : null);
        });

        authViewModel.getPasswordErrorRes().observe(getViewLifecycleOwner(), resId -> {
            if (binding != null) binding.tilGuestPassword.setError(resId != null ? getString(resId) : null);
        });

        authViewModel.getLockoutSeconds().observe(getViewLifecycleOwner(), seconds -> {
            if (binding == null) return;
            if (seconds != null && seconds > 0) {
                binding.tvGuestLockoutBanner.setText(getString(R.string.auth_error_account_locked, seconds));
                binding.tvGuestLockoutBanner.setVisibility(View.VISIBLE);
                binding.btnGuestSignIn.setEnabled(false);
            } else {
                binding.tvGuestLockoutBanner.setVisibility(View.GONE);
                binding.btnGuestSignIn.setEnabled(true);
            }
        });

        authViewModel.getLoginState().observe(getViewLifecycleOwner(), this::handleLoginState);
        authViewModel.getProfileUpdateState().observe(getViewLifecycleOwner(), this::handleProfileUpdateState);
        authViewModel.getAvatarState().observe(getViewLifecycleOwner(), this::handleAvatarState);
    }

    private void handleLoginState(@Nullable UiState<AuthSession> state) {
        if (state == null || binding == null) return;

        if (state.isLoading()) {
            binding.progressGuestSignIn.setVisibility(View.VISIBLE);
            binding.btnGuestSignIn.setEnabled(false);
            binding.btnGuestGoogleSignIn.setEnabled(false);
            binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
        } else if (state.isContent()) {
            binding.progressGuestSignIn.setVisibility(View.GONE);
            binding.btnGuestSignIn.setEnabled(true);
            binding.btnGuestGoogleSignIn.setEnabled(true);

            AuthSession session = state.getData();
            if (session != null) {
                sessionViewModel.setSession(session);
            }
            binding.etGuestPassword.setText("");
        } else if (state.isError()) {
            binding.progressGuestSignIn.setVisibility(View.GONE);
            binding.btnGuestSignIn.setEnabled(true);
            binding.btnGuestGoogleSignIn.setEnabled(true);

            String errorMsg = state.getMessageRes() != 0 ? getString(state.getMessageRes()) : "";

            // AUTH-013: a Google failure never concerns the email/password
            // fields, and its retry must not re-submit the credential form.
            // Report it non-intrusively and leave the form untouched.
            if (authViewModel.isGoogleAuth()) {
                binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
                showAnchoredSnackbar(errorMsg);
                return;
            }

            if (state.isRetryable()) {
                binding.stateContainer.setState(
                        StateContainerView.State.ERROR,
                        errorMsg,
                        getString(R.string.auth_action_retry),
                        () -> {
                            binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
                            String email = binding.etGuestEmail.getText() != null ? binding.etGuestEmail.getText().toString() : "";
                            String password = binding.etGuestPassword.getText() != null ? binding.etGuestPassword.getText().toString() : "";
                            authViewModel.login(email, password);
                        }
                );
            } else {
                binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
                binding.etGuestPassword.setText("");
                binding.tilGuestPassword.setError(errorMsg);
            }
        }
    }

    private void handleProfileUpdateState(@Nullable UiState<User> state) {
        if (state == null || binding == null) return;

        if (state.isLoading()) {
            binding.progressProfile.setVisibility(View.VISIBLE);
            binding.btnSaveProfile.setEnabled(false);
            binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
        } else if (state.isContent()) {
            binding.progressProfile.setVisibility(View.GONE);
            binding.btnSaveProfile.setEnabled(true);
            User updatedUser = state.getData();
            if (updatedUser != null) {
                sessionViewModel.updateCurrentUser(updatedUser);
            }
            showAnchoredSnackbar(R.string.auth_feedback_profile_updated);
        } else if (state.isError()) {
            binding.progressProfile.setVisibility(View.GONE);
            binding.btnSaveProfile.setEnabled(true);

            String errorMsg = state.getMessageRes() != 0 ? getString(state.getMessageRes()) : "";
            if (state.isRetryable()) {
                binding.stateContainer.setState(
                        StateContainerView.State.ERROR,
                        errorMsg,
                        getString(R.string.auth_action_retry),
                        () -> {
                            binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
                            binding.btnSaveProfile.performClick();
                        }
                );
            } else {
                binding.stateContainer.setState(StateContainerView.State.CONTENT, null, null, null);
            }
        }
    }

    private void setupFavoritesSection() {
        binding.cardFavoritesNav.setOnClickListener(v -> {
            boolean signedIn = Boolean.TRUE.equals(sessionViewModel.getIsSignedIn().getValue());
            if (signedIn) {
                try {
                    NavHostFragment.findNavController(this).navigate(R.id.action_accountFragment_to_favoritesFragment);
                } catch (Exception e) {
                    try {
                        NavHostFragment.findNavController(this).navigate(R.id.favoritesFragment);
                    } catch (Exception ignored) {}
                }
            } else {
                new com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                        .setTitle(R.string.favorites_login_required_title)
                        .setMessage(R.string.favorites_login_required_message)
                        .setPositiveButton(R.string.favorites_action_sign_in, (dialog, which) -> {
                            if (binding != null) {
                                binding.etGuestEmail.requestFocus();
                                binding.scrollContent.smoothScrollTo(0, binding.layoutGuestState.getTop());
                            }
                        })
                        .setNegativeButton(R.string.favorites_action_cancel, null)
                        .show();
            }
        });

        FavoritesRepository.getInstance(requireContext()).getFavorites().observe(getViewLifecycleOwner(), list -> {
            if (binding == null) return;
            int count = list != null ? list.size() : 0;
            binding.tvFavoritesCountBadge.setText(
                    getResources().getQuantityString(R.plurals.auth_favorites_count, count, count));
        });
    }

    private void setupThemeSection() {
        updateThemeVisuals();
        binding.cardThemeToggle.setOnClickListener(v -> {
            ThemeManager.toggleTheme(requireContext());
            updateThemeVisuals();
        });
    }

    private void updateThemeVisuals() {
        if (binding == null || !isAdded()) return;
        boolean isDark = ThemeManager.isDarkMode(requireContext());
        binding.switchThemeMode.setChecked(isDark);
        binding.ivAccountThemeIcon.setImageResource(isDark ? R.drawable.ic_light_mode : R.drawable.ic_dark_mode);
        binding.tvThemeModeSubtitle.setText(isDark
                ? R.string.auth_theme_dark_active
                : R.string.auth_theme_light_active);
    }

    /**
     * Registers the system photo picker. PickVisualMedia needs no storage
     * permission and returns a single image through a temporary read grant.
     */
    private void registerAvatarPicker() {
        pickAvatarLauncher = registerForActivityResult(
                new ActivityResultContracts.PickVisualMedia(),
                uri -> {
                    if (uri != null) {
                        // Optimistic UI: display gallery photo immediately with zero delay
                        if (binding != null && isAdded()) {
                            ImageLoaderHelper.loadImage(
                                    binding.ivProfileAvatar,
                                    uri.toString(),
                                    R.drawable.bg_avatar_transparent,
                                    R.drawable.bg_avatar_transparent);
                            binding.tvAvatarInitials.setVisibility(View.GONE);
                        }
                        readAndUploadAvatar(uri);
                    }
                });
    }

    private void openAvatarPicker() {
        if (pickAvatarLauncher == null || binding == null) return;
        pickAvatarLauncher.launch(new PickVisualMediaRequest.Builder()
                .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly.INSTANCE)
                .build());
    }

    private void readAndUploadAvatar(@NonNull Uri uri) {
        if (!isAdded() || binding == null || avatarReader == null) return;

        setAvatarBusy(true);
        Context appContext = requireContext().getApplicationContext();
        avatarReader.execute(() -> {
            byte[] compressedBytes = null;
            try {
                compressedBytes = AvatarImageCompressor.compressAndDownscaleUri(appContext, uri);
            } catch (Exception e) {
                AvatarReadResult rawResult = readAvatarBytes(appContext, uri);
                compressedBytes = rawResult.bytes;
            }
            final byte[] finalBytes = compressedBytes;
            ContextCompat.getMainExecutor(appContext).execute(() -> {
                if (binding == null || !isAdded()) return;

                if (finalBytes == null || finalBytes.length == 0) {
                    setAvatarBusy(false);
                    User currentUser = sessionViewModel.getCurrentUser().getValue();
                    if (currentUser != null) renderAvatar(currentUser);
                    showAnchoredSnackbar(R.string.auth_error_avatar_read_failed);
                    return;
                }

                if (!AvatarImageValidator.isWithinSizeLimit(finalBytes.length)) {
                    setAvatarBusy(false);
                    User currentUser = sessionViewModel.getCurrentUser().getValue();
                    if (currentUser != null) renderAvatar(currentUser);
                    showAnchoredSnackbar(R.string.auth_error_avatar_too_large);
                    return;
                }

                String mimeType = AvatarImageValidator.detectMimeType(finalBytes);
                if (mimeType == null) {
                    mimeType = "image/jpeg";
                }

                authViewModel.uploadAvatar(finalBytes, mimeType);
            });
        });
    }

    /**
     * Reads at most MAX_BYTES + 1 bytes so an oversized file is detected
     * without allocating the whole file. Runs off the main thread.
     */
    @NonNull
    private AvatarReadResult readAvatarBytes(@NonNull Context context, @NonNull Uri uri) {
        try (InputStream input = context.getContentResolver().openInputStream(uri)) {
            if (input == null) {
                return AvatarReadResult.failed();
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > AvatarImageValidator.MAX_BYTES) {
                    return AvatarReadResult.tooLarge();
                }
                output.write(buffer, 0, read);
            }

            byte[] bytes = output.toByteArray();
            return bytes.length == 0 ? AvatarReadResult.failed() : AvatarReadResult.success(bytes);
        } catch (IOException | SecurityException exception) {
            return AvatarReadResult.failed();
        }
    }

    private void handleAvatarRead(@NonNull AvatarReadResult result) {
        if (binding == null || !isAdded()) return;

        setAvatarBusy(false);

        if (result.tooLarge) {
            showAnchoredSnackbar(R.string.auth_error_avatar_too_large);
            return;
        }
        if (result.failed || result.bytes == null || !AvatarImageValidator.isWithinSizeLimit(result.bytes.length)) {
            showAnchoredSnackbar(R.string.auth_error_avatar_read_failed);
            return;
        }

        String mimeType = AvatarImageValidator.detectMimeType(result.bytes);
        if (mimeType == null) {
            showAnchoredSnackbar(R.string.auth_error_avatar_unsupported);
            return;
        }

        authViewModel.uploadAvatar(result.bytes, mimeType);
    }

    private void handleAvatarState(@Nullable UiState<User> state) {
        if (state == null || binding == null) return;

        if (state.isLoading()) {
            setAvatarBusy(true);
        } else if (state.isContent()) {
            setAvatarBusy(false);
            User updatedUser = state.getData();
            if (updatedUser != null) {
                sessionViewModel.updateCurrentUser(updatedUser);
            }
            showAnchoredSnackbar(R.string.auth_feedback_avatar_updated);
        } else if (state.isEmpty()) {
            setAvatarBusy(false);
            // DELETE answers 204; refresh so the cached User drops its URL.
            sessionViewModel.refreshProfile(null);
            showAnchoredSnackbar(R.string.auth_feedback_avatar_removed);
        } else if (state.isError()) {
            setAvatarBusy(false);
            User currentUser = sessionViewModel.getCurrentUser().getValue();
            if (currentUser != null) {
                renderAvatar(currentUser);
            }
            String message = state.getMessageRes() != 0
                    ? getString(state.getMessageRes())
                    : getString(R.string.error_generic);
            showAnchoredSnackbar(message);
        }
    }

    private void setAvatarBusy(boolean busy) {
        if (binding == null) return;
        binding.avatarContainer.setEnabled(!busy);
        binding.btnEditAvatarBadge.setEnabled(!busy);
    }

    /**
     * Renders the initials fallback and loads the photo over it. The Glide
     * placeholder and error are transparent so the initials stay visible
     * until the image actually arrives.
     */
    private void renderAvatar(@NonNull User user) {
        if (binding == null) return;

        String avatarUrl = user.getAvatarUrl();
        boolean hasAvatar = avatarUrl != null && !avatarUrl.trim().isEmpty();

        binding.tvAvatarInitials.setText(
                AvatarInitials.from(user.getFirstName(), user.getLastName(), user.getEmail()));

        ImageLoaderHelper.loadImage(
                binding.ivProfileAvatar,
                hasAvatar ? avatarUrl : null,
                R.drawable.bg_avatar_transparent,
                R.drawable.bg_avatar_transparent);
    }

    private void showAvatarPickerDialog() {
        if (!isAdded() || getContext() == null) return;
        BottomSheetDialog dialog = new BottomSheetDialog(requireContext());
        View sheetView = LayoutInflater.from(requireContext()).inflate(R.layout.bottom_sheet_avatar_picker, null);
        dialog.setContentView(sheetView);

        sheetView.findViewById(R.id.btn_take_photo).setOnClickListener(v -> {
            dialog.dismiss();
            try {
                takePictureLauncher.launch(null);
            } catch (Exception e) {
                showAnchoredSnackbar(R.string.avatar_error_save_failed);
            }
        });

        sheetView.findViewById(R.id.btn_choose_gallery).setOnClickListener(v -> {
            dialog.dismiss();
            openAvatarPicker();
        });

        User currentUser = sessionViewModel.getCurrentUser().getValue();
        boolean hasAvatar = currentUser != null && currentUser.getAvatarUrl() != null && !currentUser.getAvatarUrl().trim().isEmpty();
        View btnRemovePhoto = sheetView.findViewById(R.id.btn_remove_photo);
        if (hasAvatar) {
            btnRemovePhoto.setVisibility(View.VISIBLE);
            btnRemovePhoto.setOnClickListener(v -> {
                dialog.dismiss();
                authViewModel.deleteAvatar();
            });
        } else {
            btnRemovePhoto.setVisibility(View.GONE);
        }

        dialog.show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
        if (avatarReader != null) {
            avatarReader.shutdownNow();
            avatarReader = null;
        }
    }

    /** Result of reading a picked image off the main thread. */
    private static final class AvatarReadResult {
        private final byte[] bytes;
        private final boolean tooLarge;
        private final boolean failed;

        private AvatarReadResult(@Nullable byte[] bytes, boolean tooLarge, boolean failed) {
            this.bytes = bytes;
            this.tooLarge = tooLarge;
            this.failed = failed;
        }

        static AvatarReadResult success(@NonNull byte[] bytes) {
            return new AvatarReadResult(bytes, false, false);
        }

        static AvatarReadResult tooLarge() {
            return new AvatarReadResult(null, true, false);
        }

        static AvatarReadResult failed() {
            return new AvatarReadResult(null, false, true);
        }
    }
}
