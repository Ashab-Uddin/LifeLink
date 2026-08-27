document.addEventListener("DOMContentLoaded", async () => {

    const profileForm = document.getElementById("profile-form");

    const profileId = document.getElementById("profile-id");
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileBloodGroup =
        document.getElementById("profile-blood-group");

    const profileImage =
        document.getElementById("profile-image");

    const imagePreview =
        document.getElementById("profile-image-preview");

    const profileMessage =
        document.getElementById("profile-message");

    const logoutButton =
        document.getElementById("logout-btn");

    const sidebarLogoutButton =
        document.getElementById("profile-sidebar-logout");

    const profileDisplayName =
        document.getElementById("profile-display-name");

    const profileDisplayEmail =
        document.getElementById("profile-display-email");

    const profileBloodBadge =
        document.getElementById("profile-blood-badge");

    const profileAvatar =
        document.getElementById("profile-avatar");

    const profileAvatarImage =
        document.getElementById("profile-avatar-image");

    const profileInitials =
        document.getElementById("profile-initials");

    const profileCompleteness =
        document.getElementById("profile-completeness");

    const profileCompletenessBar =
        document.getElementById("profile-completeness-bar");

    const overviewLastDonation =
        document.getElementById("overview-last-donation");

    const overviewNextEligible =
        document.getElementById("overview-next-eligible");

    const overviewEligibilityNote =
        document.getElementById("overview-eligibility-note");

    const overviewTotalRequests =
        document.getElementById("overview-total-requests");

    const overviewOpenRequests =
        document.getElementById("overview-open-requests");

    const overviewClosedRequests =
        document.getElementById("overview-closed-requests");

    const overviewTotalDonations =
        document.getElementById("overview-total-donations");

    const overviewLivesSaved =
        document.getElementById("overview-lives-saved");

    const overviewDonationHistory =
        document.getElementById("overview-donation-history");

    const overviewChartLabels =
        document.getElementById("overview-chart-labels");

    const overviewImpactPercent =
        document.getElementById("overview-impact-percent");

    const overviewImpactLives =
        document.getElementById("overview-impact-lives");

    const editProfileButton =
        document.getElementById("edit-profile-btn");

    const cancelProfileButton =
        document.getElementById("cancel-profile-btn");

    const cropModal =
        document.getElementById("profile-crop-modal");

    const cropCanvas =
        document.getElementById("profile-crop-canvas");

    const cropZoom =
        document.getElementById("profile-crop-zoom");

    const cropUseButton =
        document.getElementById("crop-use-btn");

    const cropCancelButton =
        document.getElementById("crop-cancel-btn");

    const cropCloseButton =
        document.getElementById("crop-close-btn");

    const donorModal =
        document.getElementById("donor-application-modal");

    const openDonorFormButton =
        document.getElementById("open-donor-form-btn");

    const donorCloseButton =
        document.getElementById("donor-close-btn");


    const profileViewLinks = document.querySelectorAll("[data-profile-view]");
    const profileViewContent = document.querySelectorAll("[data-profile-content]");
    const profileLayout = document.querySelector(".profile-layout");
    const profilePage = document.querySelector(".profile-page");
    const profileHeroEditButton = document.getElementById("profile-hero-edit");
    const profileNavToggle = document.getElementById("profile-nav-toggle");
    const profileSectionNav = document.getElementById("profile-section-nav");

    function closeProfileMenu() {
        profileSectionNav?.classList.remove("is-open");
        profileNavToggle?.setAttribute("aria-expanded", "false");
        profileNavToggle?.setAttribute("aria-label", "Open profile menu");
        if (profileNavToggle) profileNavToggle.title = "Open profile menu";
    }

    profileNavToggle?.addEventListener("click", () => {
        const isOpen = profileSectionNav?.classList.toggle("is-open") ?? false;
        profileNavToggle.setAttribute("aria-expanded", String(isOpen));
        profileNavToggle.setAttribute("aria-label", isOpen ? "Close profile menu" : "Open profile menu");
        profileNavToggle.title = isOpen ? "Close profile menu" : "Open profile menu";
    });

    profileSectionNav?.querySelectorAll("a:not([data-profile-view])").forEach(link => link.addEventListener("click", event => {
        event.preventDefault();
        const destination = link.href;
        closeProfileMenu();
        window.setTimeout(() => { window.location.href = destination; }, 260);
    }));

    function showProfileView(view) {
        const selectedView = view || "overview";
        profilePage?.setAttribute("data-active-profile-view", selectedView);
        profileViewLinks.forEach(link => {
            const isActive = link.dataset.profileView === selectedView;
            link.classList.toggle("is-active", isActive);
            link.setAttribute("aria-current", isActive ? "page" : "false");
        });
        profileViewContent.forEach(content => {
            content.hidden = !content.dataset.profileContent.split(" ").includes(selectedView);
        });
        if (profileLayout) {
            profileLayout.hidden = !["achievements", "security"].includes(selectedView);
        }
    }

    window.showProfileView = function(view) {
        const selectedView = view || "overview";
        showProfileView(selectedView);
        closeProfileMenu();
        if (typeof loadBloodActivity === "function" && ["blood-requests", "donations", "ambulance"].includes(selectedView)) {
            loadBloodActivity();
        }
        if (["overview", "donations", "ambulance", "history"].includes(selectedView)) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            document.querySelector(`[data-profile-content~="${selectedView}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    window.addEventListener("hashchange", () => {
        const hash = location.hash.replace("#profile-", "");
        if (hash) {
            const targetView = ["donations", "ambulance", "history", "overview"].includes(hash) ? hash : "overview";
            window.showProfileView(targetView);
        }
    });

    profileViewLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            const view = link.dataset.profileView || "overview";
            history.replaceState(null, "", `#profile-${view}`);
            window.showProfileView(view);
        });
    });

    profileHeroEditButton?.addEventListener("click", () => {
        window.showProfileView("achievements");
        document.getElementById("profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        editProfileButton?.click();
    });

    const initialView = location.hash === "#profile-donations" ? "donations" : location.hash === "#profile-ambulance" ? "ambulance" : location.hash === "#profile-history" ? "history" : "overview";
    window.showProfileView(initialView);

    if (!profileForm) {
        return;
    }


    let currentUser = null;
    let currentImageUrl = "";
    let savedProfileValues = {};
    let cropImage = null;
    let cropScale = 1;
    let cropOffsetX = 0;
    let cropOffsetY = 0;
    let cropDragStart = null;

    function updateProfileSummary() {
        const name = profileName.value.trim() || "Your name";
        const email = profileEmail.value || "";
        const bloodGroup = profileBloodGroup.value;
        const initials = name.split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase() || "L";

        profileDisplayName.textContent = name;
        profileDisplayEmail.textContent = email;
        profileBloodBadge.textContent = bloodGroup || "Blood group not set";
        profileInitials.textContent = initials;

        if (currentImageUrl) {
            profileAvatarImage.src = currentImageUrl;
            profileAvatar.classList.add("has-image");
        } else {
            profileAvatarImage.removeAttribute("src");
            profileAvatar.classList.remove("has-image");
        }

        const completeness = [
            name !== "Your name",
            Boolean(email),
            Boolean(bloodGroup),
            Boolean(currentImageUrl)
        ].filter(Boolean).length * 25;

        profileCompleteness.textContent = `${completeness}%`;
        profileCompletenessBar.style.width = `${completeness}%`;
    }

    async function loadOverview() {
        if (!currentUser || !overviewNextEligible) return;

        const { data: bloodRequests, error: requestError } = await supabaseClient
            .from("blood_requests")
            .select("status")
            .eq("user_id", currentUser.id);

        if (!requestError) {
            const requests = bloodRequests || [];
            const openRequests = requests.filter(request => String(request.status).toLowerCase() === "open").length;
            const closedRequests = requests.filter(request => String(request.status).toLowerCase() === "closed").length;
            if (overviewTotalRequests) overviewTotalRequests.textContent = requests.length;
            if (overviewOpenRequests) overviewOpenRequests.textContent = openRequests;
            if (overviewClosedRequests) overviewClosedRequests.textContent = closedRequests;
        }

        const { data: donorApplication, error } = await supabaseClient
            .from("blood_donor_applications")
            .select("gender,last_donation_date,location,blood_group")
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error || !donorApplication?.last_donation_date) {
            if (overviewTotalDonations) overviewTotalDonations.textContent = "0";
            if (overviewLivesSaved) overviewLivesSaved.textContent = "0";
            if (overviewDonationHistory) overviewDonationHistory.innerHTML = '<p class="muted">No completed donations recorded.</p>';
            if (overviewImpactPercent) overviewImpactPercent.textContent = "0%";
            if (overviewImpactLives) overviewImpactLives.textContent = "0";
            return;
        }

        const { data: donations, error: donationsError } = await supabaseClient
            .from("blood_donations")
            .select("id,blood_group,donation_date,created_at")
            .eq("donor_user_id", currentUser.id)
            .order("donation_date", { ascending: false });
        const donationRows = donationsError ? [] : (donations || []);
        const donationCount = donationRows.length;
        if (overviewTotalDonations) overviewTotalDonations.textContent = donationCount;
        if (overviewLivesSaved) overviewLivesSaved.textContent = donationCount * 3;
        if (overviewImpactLives) overviewImpactLives.textContent = donationCount * 3;
        if (overviewImpactPercent) overviewImpactPercent.textContent = donationCount ? "100%" : "0%";
        if (overviewDonationHistory) {
            overviewDonationHistory.innerHTML = donationCount
                ? donationRows.map(donation => `<article><strong>Donation recorded</strong><span>${new Date(`${donation.donation_date}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span><small>${donation.blood_group || donorApplication.blood_group || "Blood group not provided"}</small></article>`).join("")
                : '<p class="muted">No completed donations recorded.</p>';
        }

        const lastDonation = new Date(`${donorApplication.last_donation_date}T00:00:00`);
        if (Number.isNaN(lastDonation.getTime())) return;

        const requiredDays = ["male", "female"].includes(String(donorApplication.gender).toLowerCase()) ? 120 : null;
        if (!requiredDays) {
            overviewNextEligible.textContent = "Not set";
            overviewEligibilityNote.textContent = "Complete your donor details";
            return;
        }
        const eligibleDate = new Date(lastDonation);
        eligibleDate.setTime(eligibleDate.getTime() + requiredDays * 86400000);
        overviewLastDonation.textContent = `Last donation: ${lastDonation.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;
        if (overviewChartLabels) {
            const months = Array.from({ length: 6 }, (_, index) => {
                const month = new Date();
                month.setDate(1);
                month.setMonth(month.getMonth() - 5 + index);
                return month;
            });
            overviewChartLabels.innerHTML = months.map(month => `<span>${month.toLocaleDateString(undefined, { month: "short" })}</span>`).join("");
            const donationIndexes = donationRows.map(donation => {
                const date = new Date(`${donation.donation_date}T00:00:00`);
                return months.findIndex(month => month.getFullYear() === date.getFullYear() && month.getMonth() === date.getMonth());
            });
            const points = months.map((_, index) => `${index * 120},${donationIndexes.includes(index) ? 30 : 168}`).join(" ");
            const line = document.querySelector(".overview-chart-line polyline");
            if (line) line.setAttribute("points", points);
            document.querySelectorAll(".overview-chart-line circle").forEach((circle, index) => {
                circle.setAttribute("cx", index * 120);
                circle.setAttribute("cy", donationIndexes.includes(index) ? 30 : 168);
            });
        }

        if (eligibleDate <= new Date()) {
            overviewNextEligible.textContent = "Eligible now";
            overviewEligibilityNote.textContent = "You can donate blood now";
        } else {
            overviewNextEligible.textContent = eligibleDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
            overviewEligibilityNote.textContent = "Based on your last donation";
        }
    }

    function setEditMode(isEditing) {
        profileForm.classList.toggle("is-editing", isEditing);
        [profileName, profileBloodGroup, profileImage].forEach(field => {
            field.disabled = !isEditing;
        });
        if (editProfileButton) {
            editProfileButton.textContent = isEditing ? "Editing" : "Edit";
            editProfileButton.disabled = isEditing;
        }
    }

    function saveCurrentValues() {
        savedProfileValues = {
            name: profileName.value,
            bloodGroup: profileBloodGroup.value,
            imageUrl: currentImageUrl
        };
    }

    function restoreSavedValues() {
        profileName.value = savedProfileValues.name || "";
        profileBloodGroup.value = savedProfileValues.bloodGroup || "";
        currentImageUrl = savedProfileValues.imageUrl || "";
        profileImage.value = "";
        showImage(currentImageUrl);
        updateProfileSummary();
    }


    // =====================================
    // MESSAGE
    // =====================================

    function showMessage(message) {

        profileMessage.textContent = message;

    }


    // =====================================
    // DISPLAY IMAGE
    // =====================================

    function showImage(url) {

        currentImageUrl = url || "";

        updateProfileSummary();

        if (!url) {

            imagePreview.innerHTML = "";

            return;
        }

        imagePreview.innerHTML = `
            <img
                src="${url}"
                alt="Profile Photo"
                style="
                    width:120px;
                    height:120px;
                    object-fit:cover;
                    border-radius:50%;
                    display:block;
                "
            >
        `;

    }

    function drawCropImage() {
        const context = cropCanvas.getContext("2d");
        const canvasSize = cropCanvas.width;

        context.clearRect(0, 0, canvasSize, canvasSize);
        context.fillStyle = "#102a43";
        context.fillRect(0, 0, canvasSize, canvasSize);

        if (!cropImage) {
            return;
        }

        const coverScale = Math.max(
            canvasSize / cropImage.width,
            canvasSize / cropImage.height
        );
        const width = cropImage.width * coverScale * cropScale;
        const height = cropImage.height * coverScale * cropScale;
        const x = (canvasSize - width) / 2 + cropOffsetX;
        const y = (canvasSize - height) / 2 + cropOffsetY;

        context.drawImage(cropImage, x, y, width, height);
    }

    function closeCropper() {
        cropModal.hidden = true;
        cropImage = null;
        cropCanvas.getContext("2d").clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        profileImage.value = "";
    }

    function openCropper(file) {
        const reader = new FileReader();

        reader.onload = () => {
            cropImage = new Image();
            cropImage.onload = () => {
                cropScale = 1;
                cropOffsetX = 0;
                cropOffsetY = 0;
                cropZoom.value = "1";
                drawCropImage();
                cropModal.hidden = false;
            };
            cropImage.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function createCroppedFile() {
        return new Promise((resolve, reject) => {
            cropCanvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error("Unable to crop this image."));
                    return;
                }
                resolve(new File([blob], "profile-photo.jpg", { type: "image/jpeg" }));
            }, "image/jpeg", .92);
        });
    }


    // =====================================
    // LOAD PROFILE
    // =====================================

    async function loadProfile() {

        try {

            const {
                data: { user },
                error: userError
            } = await supabaseClient.auth.getUser();


            if (userError || !user) {

                window.location.href =
                    "/index/login.html";

                return;

            }


            currentUser = user;


            profileId.value =
                user.id;

            profileEmail.value =
                user.email || "";


            const {
                data: profile,
                error: profileError
            } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();


            if (profileError) {

                console.error(
                    "Profile loading error:",
                    profileError
                );

                showMessage(
                    "Unable to load profile."
                );

                return;

            }


            if (profile) {

                profileName.value =
                    profile.full_name || "";

                profileBloodGroup.value =
                    profile.blood_group || "";

                currentImageUrl = profile.profile_image || "";

                showImage(currentImageUrl);

            } else {

                profileName.value =
                    user.user_metadata?.full_name || "";

            }

            updateProfileSummary();
            saveCurrentValues();
            setEditMode(false);


        } catch (error) {

            console.error(error);

            showMessage(
                "Something went wrong."
            );

        }

    }


    // =====================================
    // UPLOAD IMAGE
    // =====================================

    async function uploadProfileImage(file) {

        if (!currentUser || !file) {
            return null;
        }


        // File size limit: 2 MB

        if (file.size > 2 * 1024 * 1024) {

            throw new Error(
                "Image must be smaller than 2 MB."
            );

        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (!allowedTypes.includes(file.type)) {

            throw new Error(
                "Only JPG, PNG and WEBP images are allowed."
            );

        }


        const fileExtension =
            file.type.split("/")[1] || "jpg";


        const filePath =
            `${currentUser.id}/profile-${Date.now()}.${fileExtension}`;


        showMessage(
            "Uploading profile photo..."
        );


        const {
            error: uploadError
        } = await supabaseClient.storage
            .from("profile-images")
            .upload(
                filePath,
                file,
                {
                    upsert: true,
                    contentType: file.type
                }
            );


        if (uploadError) {

            console.error(
                "Image upload error:",
                uploadError
            );

            throw uploadError;

        }


        const {
            data
        } = supabaseClient.storage
            .from("profile-images")
            .getPublicUrl(filePath);


        return data.publicUrl;

    }


    // =====================================
    // IMAGE SELECT
    // =====================================

    profileImage.addEventListener(
        "change",
        () => {

            const file =
                profileImage.files[0];


            if (!file) {
                return;
            }


            openCropper(file);

        }
    );

    cropZoom.addEventListener("input", () => {
        cropScale = Number(cropZoom.value);
        drawCropImage();
    });

    cropCanvas.addEventListener("pointerdown", event => {
        cropCanvas.setPointerCapture(event.pointerId);
        cropDragStart = {
            x: event.clientX - cropOffsetX,
            y: event.clientY - cropOffsetY
        };
        cropCanvas.classList.add("is-dragging");
    });

    cropCanvas.addEventListener("pointermove", event => {
        if (!cropDragStart) {
            return;
        }
        cropOffsetX = event.clientX - cropDragStart.x;
        cropOffsetY = event.clientY - cropDragStart.y;
        drawCropImage();
    });

    cropCanvas.addEventListener("pointerup", () => {
        cropDragStart = null;
        cropCanvas.classList.remove("is-dragging");
    });

    cropCanvas.addEventListener("pointercancel", () => {
        cropDragStart = null;
        cropCanvas.classList.remove("is-dragging");
    });

    [cropCancelButton, cropCloseButton].forEach(button => {
        button.addEventListener("click", closeCropper);
    });

    cropUseButton.addEventListener("click", async () => {
        try {
            cropUseButton.disabled = true;
            const croppedFile = await createCroppedFile();
            closeCropper();
            const imageUrl = await uploadProfileImage(croppedFile);
            showImage(imageUrl);

            const { error } = await supabaseClient
                .from("profiles")
                .upsert({
                    id: currentUser.id,
                    full_name: profileName.value.trim() || null,
                    email: currentUser.email,
                    blood_group: profileBloodGroup.value || null,
                    profile_image: imageUrl
                }, { onConflict: "id" });

            if (error) {
                throw error;
            }

            showMessage("Profile photo uploaded successfully!");
            saveCurrentValues();
            updateProfileSummary();
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Image upload failed.");
        } finally {
            cropUseButton.disabled = false;
            profileImage.value = "";
        }
    });


    // =====================================
    // SAVE PROFILE
    // =====================================

    profileForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                return;

            }


            const fullName =
                profileName.value.trim();

            const bloodGroup =
                profileBloodGroup.value;


            if (!fullName) {

                showMessage(
                    "Please enter your full name."
                );

                return;

            }

            const { data: donorApplication } = await supabaseClient
                .from("blood_donor_applications")
                .select("blood_group")
                .eq("user_id", currentUser.id)
                .maybeSingle();
            if (donorApplication && String(donorApplication.blood_group || "").trim().toLowerCase() !== String(bloodGroup || "").trim().toLowerCase()) {
                showMessage("Your profile blood group must match your donor application.");
                return;
            }


            showMessage(
                "Saving profile..."
            );


            const {
                error
            } = await supabaseClient
                .from("profiles")
                .upsert(
                    {
                        id: currentUser.id,

                        full_name: fullName,

                        email: currentUser.email,

                        blood_group:
                            bloodGroup || null
                    },
                    {
                        onConflict: "id"
                    }
                );


            if (error) {

                console.error(
                    "Profile save error:",
                    error
                );

                showMessage(
                    error.message
                );

                return;

            }


            // Update Auth metadata

            await supabaseClient.auth.updateUser({
                data: {
                    full_name: fullName
                }
            });


            showMessage(
                "Profile saved successfully!"
            );

            saveCurrentValues();
            setEditMode(false);

        }
    );

    cancelProfileButton.addEventListener("click", () => {
        restoreSavedValues();
        showMessage("Changes discarded.");
        setEditMode(false);
    });

    editProfileButton?.addEventListener("click", () => {
        saveCurrentValues();
        setEditMode(true);
        profileName.focus();
    });

    async function openDonorForm() {
        if (!currentUser) {
            window.location.href = "/index/login.html";
            return;
        }
        const donorForm = document.getElementById("donor-form");
        const donorExisting = document.getElementById("donor-existing");
        donorForm.hidden = true;
        donorForm.style.display = "none";
        donorExisting.hidden = true;
        donorExisting.style.display = "none";
        const { data, error } = await supabaseClient.from("blood_donor_applications")
            .select("id").eq("user_id", currentUser.id).maybeSingle();
        if (error) {
            console.error("Donor application check error:", error);
            return;
        }
        donorModal.hidden = false;
        if (data) {
            donorExisting.hidden = false;
            donorExisting.style.display = "";
            return;
        }
        donorForm.hidden = false;
        donorForm.style.display = "";
        document.getElementById("donor-name")?.focus();
    }

    openDonorFormButton?.addEventListener("click", openDonorForm);

    let selectedProfileRequest = null;
    let selectedProfileResponses = [];
    let profileRequestDetailsEventsBound = false;
    let profileResponseDetailsEventsBound = false;
    const notificationList = document.getElementById("profile-notification-list");
    const notificationCount = document.getElementById("profile-notification-count");
    const markNotificationsReadButton = document.getElementById("profile-mark-notifications-read");
    const knownNotificationIds = new Set();
    let notificationRealtimeReady = false;
    let notificationChannel = null;
    let ambulanceRealtimeReady = false;
    let ambulanceChannel = null;
    let notificationEventsBound = false;

    let notificationAudioContext = null;
    const unlockNotificationSound = () => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        notificationAudioContext ||= new AudioContextClass();
        notificationAudioContext.resume();
    };
    document.addEventListener("pointerdown", unlockNotificationSound, { once: true });
    document.addEventListener("keydown", unlockNotificationSound, { once: true });
    const playNotificationSound = () => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        notificationAudioContext ||= new AudioContextClass();
        const context = notificationAudioContext;
        context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.24);
    };

    async function loadBloodActivity() {
        const requestList = document.getElementById("profile-blood-requests");
        const donationRequestList = document.getElementById("profile-donation-requests");
        const incomingRequestList = document.getElementById("profile-incoming-requests");
        const ambulanceRequestList = document.getElementById("profile-ambulance-requests");
        const ambulanceProviderRequestList = document.getElementById("profile-ambulance-provider-requests");
        if (!currentUser || (!requestList && !donationRequestList && !incomingRequestList && !ambulanceRequestList && !ambulanceProviderRequestList)) return;
        const escape = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
        const formatDate = value => value ? new Date(String(value).includes("T") ? value : `${value}T00:00:00`).toLocaleDateString() : "Not provided";
        const formatTime = value => value ? value.slice(0, 5) : "Not provided";
        const formatDateTime = value => value ? new Date(value).toLocaleString() : "Not provided";
        const requestDetailsModal = document.getElementById("profile-request-details-modal");
        const requestDeleteButton = document.getElementById("profile-request-delete");
        const responseDetailsModal = document.getElementById("profile-response-details-modal");
        const detail = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value || "Not provided";
        };
        if (ambulanceRequestList) {
            const { data: ambulanceRequests, error: ambulanceRequestError } = await supabaseClient.from("ambulance_requests")
                .select("id,patient_name,emergency_type,pickup_location,destination_hospital,distance_km,estimated_fare,final_distance_km,final_fare,status,requested_at,accepted_at,pickup_at,completed_at,ambulances(name,type)")
                .eq("user_id", currentUser.id).order("requested_at", { ascending: false });
            if (ambulanceRequestError || !ambulanceRequests?.length) {
                ambulanceRequestList.innerHTML = '<p class="muted">No ambulance requests yet.</p>';
            } else {
                ambulanceRequestList.innerHTML = `<table class="ambulance-request-table"><thead><tr><th>Ambulance</th><th>Patient / emergency</th><th>Trip</th><th>Distance / fare</th><th>Status</th><th>Requested</th></tr></thead><tbody>${ambulanceRequests.map(request => {
                    const hasFinalFare = request.final_fare !== null && request.final_fare !== undefined;
                    const distance = hasFinalFare ? request.final_distance_km : request.distance_km;
                    const fare = hasFinalFare ? request.final_fare : request.estimated_fare;
                    return `<tr><td><strong>${escape(request.ambulances?.name || "Ambulance")}</strong><small>${escape(request.ambulances?.type || "")}</small></td><td><strong>${escape(request.patient_name)}</strong><small>${escape(request.emergency_type)}</small></td><td><small>${escape(request.pickup_location)} → ${escape(request.destination_hospital)}</small></td><td>${Number(distance || 0).toFixed(1)} km · ৳${Number(fare || 0).toFixed(2).replace(/\.00$/, "")}</td><td>${renderAmbulanceTimeline(request, escape)}</td><td>${escape(formatDateTime(request.requested_at))}</td></tr>`;
                }).join("")}</tbody></table>`;
            }
        }
        if (ambulanceProviderRequestList) {
            const { data: ownedAmbulances, error: ownedAmbulanceError } = await supabaseClient.from("ambulances")
                .select("id,name,type,provider_user_id").eq("provider_user_id", currentUser.id);
            const ownedAmbulanceIds = (ownedAmbulances || []).map(ambulance => ambulance.id);
            const { data: providerRequests, error: providerRequestError } = ownedAmbulanceIds.length
                ? await supabaseClient.from("ambulance_requests")
                    .select("id,ambulance_id,patient_name,patient_phone,emergency_type,pickup_location,destination_hospital,distance_km,estimated_fare,status,requested_at,accepted_at,pickup_at,completed_at,provider_location,estimated_arrival_at,ambulances(name,type)")
                    .in("ambulance_id", ownedAmbulanceIds).order("requested_at", { ascending: false })
                : { data: [], error: ownedAmbulanceError };
            if (providerRequestError || !providerRequests?.length) {
                ambulanceProviderRequestList.innerHTML = '<p class="muted">No incoming ambulance requests.</p>';
            } else {
                ambulanceProviderRequestList.innerHTML = `<table class="ambulance-request-table"><thead><tr><th>Ambulance</th><th>Patient</th><th>Trip</th><th>Fare</th><th>Status / Action</th></tr></thead><tbody>${providerRequests.map(request => `<tr><td><strong>${escape(request.ambulances?.name || "Ambulance")}</strong><small>${escape(request.ambulances?.type || "")}</small></td><td><strong>${escape(request.patient_name)}</strong><small>${escape(request.patient_phone)} · ${escape(request.emergency_type)}</small></td><td><small>${escape(request.pickup_location)} → ${escape(request.destination_hospital)}</small><br>${Number(request.distance_km || 0).toFixed(1)} km</td><td>৳${Number(request.estimated_fare || 0).toFixed(2).replace(/\.00$/, "")}<small>${escape(request.provider_location || "")}</small><small>${request.estimated_arrival_at ? escape(formatDateTime(request.estimated_arrival_at)) : ""}</small></td><td>${renderAmbulanceTimeline(request, escape)}<div class="ambulance-provider-actions">${request.status === "requested" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="accepted">Accept</button><button class="btn btn-outline provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="rejected">Reject</button>` : request.status === "accepted" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="on_the_way">On the way</button>` : request.status === "on_the_way" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="picked_up">Picked up</button>` : request.status === "picked_up" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="arrived">Arrived</button>` : request.status === "arrived" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="completed">Complete</button>` : ""}</div></td></tr>`).join("")}</tbody></table>`;
                ambulanceProviderRequestList.querySelectorAll(".provider-ambulance-status").forEach(button => button.addEventListener("click", async () => {
                    button.disabled = true;
                    const { error } = await supabaseClient.rpc("update_ambulance_request_status", { p_request_id: button.dataset.requestId, p_status: button.dataset.status });
                    if (error) {
                        button.disabled = false;
                        if (typeof toast === "function") toast(error.message || "Unable to update ambulance request.", "error");
                        return;
                    }
                    await loadBloodActivity();
                }));
            }
        }
        const closeRequestDetails = () => {
            if (requestDetailsModal) requestDetailsModal.hidden = true;
            selectedProfileRequest = null;
        };
        const showRequestDetails = request => {
            if (!request) return;
            selectedProfileRequest = request;
            detail("profile-request-details-title", `Request for ${request.patient_name}`);
            detail("profile-request-details-blood", request.blood_group);
            detail("profile-request-details-blood-label", request.blood_group);
            detail("profile-request-details-patient", request.patient_name);
            detail("profile-request-details-location", `${request.donation_center} · ${request.district}`);
            detail("profile-request-details-full-location", [request.address, request.upazila, request.district, request.division].filter(Boolean).join(", "));
            detail("profile-request-details-amount", `${request.blood_amount_bags} bag${Number(request.blood_amount_bags) === 1 ? "" : "s"}`);
            detail("profile-request-details-posted", formatDate(request.created_at?.slice(0, 10)));
            detail("profile-request-details-date", formatDate(request.donation_date));
            detail("profile-request-details-time", formatTime(request.donation_time));
            detail("profile-request-details-center", request.donation_center);
            detail("profile-request-details-hemoglobin", request.hemoglobin ? `${request.hemoglobin} g/dL` : "Not provided");
            detail("profile-request-details-problem", request.patient_problem);
            const requestStatus = request.status || "open";
            detail("profile-request-details-status", requestStatus.charAt(0).toUpperCase() + requestStatus.slice(1));
            if (requestDeleteButton) {
                requestDeleteButton.hidden = request.user_id !== currentUser.id;
                requestDeleteButton.disabled = request.user_id !== currentUser.id;
            }
            const contact = document.getElementById("profile-request-details-contact");
            if (contact) {
                contact.textContent = request.contact_number || "Contact not provided";
                contact.href = request.contact_number ? `tel:${request.contact_number}` : "#";
            }
            const whatsapp = document.getElementById("profile-request-details-whatsapp");
            if (whatsapp) {
                const whatsappNumber = String(request.whatsapp_number || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
                whatsapp.textContent = request.whatsapp_number || "WhatsApp not provided";
                whatsapp.href = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
                whatsapp.target = whatsappNumber ? "_blank" : "_self";
                whatsapp.rel = whatsappNumber ? "noopener" : "";
            }
            const requestMessage = document.getElementById("profile-request-details-message");
            if (requestMessage) {
                requestMessage.textContent = "";
                requestMessage.classList.remove("is-error");
            }
            if (requestDeleteButton) requestDeleteButton.disabled = false;
            if (requestDetailsModal) requestDetailsModal.hidden = false;
        };
        const closeRequest = async request => {
            if (!request || request.status === "closed" || !window.confirm("Close this blood request?")) return;
            const { error } = await supabaseClient.from("blood_requests")
                .update({ status: "closed" }).eq("id", request.id).eq("user_id", currentUser.id);
            if (error) {
                if (typeof toast === "function") toast(error.message || "Unable to close this request.", "error");
                return;
            }
            if (typeof toast === "function") toast("Blood request closed.", "success");
            await loadOverview();
            await loadBloodActivity();
        };
        const deleteRequest = async request => {
            if (!request || !window.confirm("Delete this blood request?")) return;
            const { error } = await supabaseClient.from("blood_requests")
                .delete().eq("id", request.id).eq("user_id", currentUser.id);
            if (error) {
                if (typeof toast === "function") toast(error.message || "Unable to delete this request.", "error");
                return;
            }
            if (selectedProfileRequest?.id === request.id) closeRequestDetails();
            if (typeof toast === "function") toast("Blood request deleted.", "success");
            await loadOverview();
            await loadBloodActivity();
        };
        const showResponseDetails = async responses => {
            const message = document.getElementById("profile-response-details-message");
            const responseList = document.getElementById("profile-response-list");
            if (!responseDetailsModal || !responseList) return;
            selectedProfileResponses = responses;
            detail("profile-response-details-title", responses.length ? "Donor responses" : "Donor responses");
            if (!responses.length) {
                responseList.innerHTML = "<p class=\"muted\">No responses yet.</p>";
                responseDetailsModal.hidden = false;
                return;
            }
            if (message) message.textContent = "Loading donor details...";
            const donorResults = await Promise.all(responses.map(async response => ({ response, result: await supabaseClient.from("blood_donor_applications")
                .select("full_name,blood_group,gender,phone,email,location,last_donation_date")
                .eq("user_id", response.donor_user_id).eq("status", "available").maybeSingle() })));
            responseList.innerHTML = donorResults.map(({ response, result: { data: donor, error } }) => {
                if (error || !donor) return `<article class="profile-response-item"><strong>Donor details unavailable</strong><p class="muted">${escape(error?.message || "This donor is no longer available.")}</p></article>`;
                const phone = donor.phone ? `<a href="tel:${escape(donor.phone)}">${escape(donor.phone)}</a>` : "Not provided";
                const email = donor.email ? `<a href="mailto:${escape(donor.email)}">${escape(donor.email)}</a>` : "Not provided";
                    return `<article class="profile-response-item"><div class="profile-response-person"><div class="avatar">${escape(donor.blood_group || "?")}</div><div><h3>${escape(donor.full_name)}</h3><span class="badge">${escape(donor.blood_group || "Blood group not provided")}</span><p class="muted">${escape(donor.location || "Location not provided")}</p></div></div><dl class="profile-response-details-grid"><div><dt>Phone</dt><dd>${phone}</dd></div><div><dt>Email</dt><dd>${email}</dd></div><div><dt>Gender</dt><dd>${escape(donor.gender || "Not provided")}</dd></div><div><dt>Last donation</dt><dd>${formatDate(donor.last_donation_date)}</dd></div><div><dt>Response time</dt><dd>${formatDateTime(response.created_at)}</dd></div></dl><div class="profile-response-item-actions"><button class="profile-response-accept-button" type="button" data-response-decision="accept" data-response-id="${escape(response.id)}">Accept response</button><button class="profile-response-reject-button" type="button" data-response-decision="reject" data-response-id="${escape(response.id)}">Not accept</button></div></article>`;
            }).join("");
            if (message) message.textContent = "";
            responseDetailsModal.hidden = false;
        };
        const updateResponseDecision = async (responseId, decision) => {
            if (decision === "accept") {
                const { error } = await supabaseClient.rpc("accept_blood_response", { p_response_id: responseId });
                if (error) {
                    if (typeof toast === "function") toast(error.message || "Unable to accept this response.", "error");
                    return;
                }
                if (responseDetailsModal) responseDetailsModal.hidden = true;
                selectedProfileResponses = [];
                if (typeof toast === "function") toast("Response accepted and donation recorded.", "success");
                await loadOverview();
                await loadBloodActivity();
                return;
            }
            const column = decision === "accept" ? "accepted_at" : "rejected_at";
            const { error } = await supabaseClient.from("blood_request_notifications")
                .update({ [column]: new Date().toISOString() })
                .eq("id", responseId).eq("recipient_user_id", currentUser.id);
            if (error) {
                if (typeof toast === "function") toast(error.message || "Unable to update this response.", "error");
                return;
            }
            if (responseDetailsModal) responseDetailsModal.hidden = true;
            selectedProfileResponses = [];
            if (typeof toast === "function") toast(decision === "accept" ? "Response accepted." : "Response declined.", "success");
            await loadOverview();
            await loadBloodActivity();
        };
        if (requestList) {
        const { data: requests, error: requestError } = await supabaseClient.from("blood_requests")
            .select("id,patient_name,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,hemoglobin,patient_problem,status,created_at")
            .eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(10);
        if (requestError || !requests?.length) requestList.innerHTML = `<p class="muted">No blood requests yet.</p>`;
        else {
            requestList.innerHTML = requests.map(request => `<article class="profile-activity-item profile-request-item" tabindex="0" role="button" data-request-id="${escape(request.id)}"><strong>${escape(request.patient_name)}</strong><span>${escape(request.blood_group)} · ${escape(request.donation_center)}</span><small>${escape(request.district)} · ${formatDate(request.donation_date)} · ${escape(request.blood_amount_bags)} bag${Number(request.blood_amount_bags) === 1 ? "" : "s"}</small><b>${escape(request.status || "open")}</b><em>View details</em><div class="profile-request-card-actions"><button class="profile-request-response-button" type="button">See response</button><button class="profile-request-close-button" type="button"${request.status === "closed" ? " disabled" : ""}>${request.status === "closed" ? "Request closed" : "Close request"}</button><button class="profile-request-delete-button" type="button">Delete request</button></div></article>`).join("");
            requestList.querySelectorAll("[data-request-id]").forEach(card => {
                const request = requests.find(item => item.id === card.dataset.requestId);
                const open = () => showRequestDetails(request);
                card.addEventListener("click", open);
                card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
                card.querySelector(".profile-request-close-button")?.addEventListener("click", event => { event.stopPropagation(); closeRequest(request); });
                card.querySelector(".profile-request-delete-button")?.addEventListener("click", event => { event.stopPropagation(); deleteRequest(request); });
            });
        }
        }

        if (donationRequestList) {
            const { data: donationRequests, error: donationRequestError } = await supabaseClient.from("blood_donation_requests")
                .select("id,blood_request_id,donor_user_id,status,created_at,completed_at,blood_requests(id,user_id,patient_name,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,patient_problem,created_at)")
                .eq("requester_user_id", currentUser.id).order("created_at", { ascending: false });
            const { data: sentNotifications } = await supabaseClient.from("blood_request_notifications")
                .select("request_id,message,notification_type,created_at,read_at,cleared_at")
                .eq("recipient_user_id", currentUser.id).not("donor_user_id", "is", null).order("created_at", { ascending: false });
            const latestNotificationByRequest = new Map();
            (sentNotifications || []).forEach(notification => {
                if (!latestNotificationByRequest.has(notification.request_id)) latestNotificationByRequest.set(notification.request_id, notification);
            });
            if (donationRequestError || !donationRequests?.length) {
                donationRequestList.innerHTML = '<p class="muted">No donation requests yet.</p>';
            } else {
                const donorResults = await Promise.all(donationRequests.map(async donationRequest => ({ donationRequest, result: await supabaseClient.from("blood_donor_applications").select("full_name,phone,location").eq("user_id", donationRequest.donor_user_id).maybeSingle() })));
                donationRequestList.innerHTML = `<div class="sent-donation-table-wrap"><table class="sent-donation-table"><thead><tr><th>Donor</th><th>Blood group</th><th>Request date</th><th>Status</th><th>Latest update</th><th>Action</th></tr></thead><tbody>${donorResults.map(({ donationRequest, result }) => {
                    const request = donationRequest.blood_requests || {};
                    const completed = donationRequest.status === "completed";
                    const accepted = donationRequest.status === "accepted";
                    const statusLabel = donationRequest.status ? donationRequest.status.charAt(0).toUpperCase() + donationRequest.status.slice(1) : "Pending";
                    const donor = result.data || {};
                    const notification = latestNotificationByRequest.get(donationRequest.blood_request_id);
                    const latestMessage = notification
                        ? `<span class="donation-request-notification${notification.read_at ? "" : " is-new"}">${escape(notification.message)} <time>${escape(formatDateTime(notification.created_at))}</time></span>`
                        : completed
                            ? '<span class="muted">Donation completed</span>'
                            : '<span class="muted">No update yet</span>';
                    return `<tr><td><strong>${escape(donor.full_name || "Donor")}</strong><small>${escape(donor.location || "Location not provided")}</small></td><td>${escape(request.blood_group || "Not provided")}</td><td>${formatDate(donationRequest.created_at)}</td><td><b class="sent-request-status sent-request-status-${escape(donationRequest.status)}">${escape(statusLabel)}</b></td><td>${latestMessage}</td><td><div class="donation-request-actions"><button class="details-donation-request-button" type="button" data-donation-request-id="${escape(donationRequest.id)}">Details</button>${completed ? '<b>Donation Completed</b>' : accepted ? `<button class="gave-blood-button" type="button" data-donation-request-id="${escape(donationRequest.id)}">Confirm Donation</button>` : donationRequest.status === "declined" ? '<span class="muted">Request Declined</span>' : '<span class="muted">Pending donor response</span>'}<button class="clear-donation-request-button" type="button" data-donation-request-id="${escape(donationRequest.id)}">Clear</button></div></td></tr>`;
                }).join("")}</tbody></table></div>`;
                donationRequestList.querySelectorAll(".details-donation-request-button").forEach(button => {
                    button.addEventListener("click", () => {
                        const row = donorResults.find(({ donationRequest }) => donationRequest.id === button.dataset.donationRequestId);
                        showRequestDetails(row ? { ...row.donationRequest.blood_requests, status: row.donationRequest.status } : null);
                    });
                });
                donationRequestList.querySelectorAll(".gave-blood-button").forEach(button => {
                    button.addEventListener("click", async () => {
                        button.disabled = true;
                        const { error } = await supabaseClient.rpc("mark_blood_donation_given", { p_donation_request_id: button.dataset.donationRequestId });
                        if (error) {
                            button.disabled = false;
                            if (typeof toast === "function") toast(error.message || "Unable to complete this donation.", "error");
                            return;
                        }
                        if (typeof toast === "function") toast("Donation completed and recorded.", "success");
                        await loadOverview();
                        await loadBloodActivity();
                    });
                });
                donationRequestList.querySelectorAll(".clear-donation-request-button").forEach(button => {
                    button.addEventListener("click", async () => {
                        const donationRequest = donorResults.find(({ donationRequest }) => donationRequest.id === button.dataset.donationRequestId)?.donationRequest;
                        if (!donationRequest) return;
                        if (donationRequest.status === "completed") {
                            const { error } = await supabaseClient.from("blood_request_notifications")
                                .update({ cleared_at: new Date().toISOString() })
                                .eq("request_id", donationRequest.blood_request_id)
                                .eq("recipient_user_id", currentUser.id)
                                .eq("notification_type", "donation_completed");
                            if (error) {
                                if (typeof toast === "function") toast(error.message || "Unable to clear the thank-you message.", "error");
                                return;
                            }
                            if (typeof toast === "function") toast("Donation message cleared.", "success");
                            await loadBloodActivity();
                            return;
                        }
                        if (!window.confirm("Clear this donation request from your list?")) return;
                        button.disabled = true;
                        const { error } = await supabaseClient.from("blood_donation_requests")
                            .delete().eq("id", button.dataset.donationRequestId).eq("requester_user_id", currentUser.id);
                        if (error) {
                            button.disabled = false;
                            if (typeof toast === "function") toast(error.message || "Unable to clear this donation request.", "error");
                            return;
                        }
                        if (typeof toast === "function") toast("Donation request cleared.", "success");
                        await loadBloodActivity();
                    });
                });
            }
        }

        if (incomingRequestList) {
            const { data: notifications, error: notificationError } = await supabaseClient.from("blood_request_notifications")
                .select("id,request_id,message,created_at,accepted_at,rejected_at,cleared_at,blood_requests(id,patient_name,user_id,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,patient_problem,created_at)")
                .eq("recipient_user_id", currentUser.id).eq("donor_user_id", currentUser.id).is("cleared_at", null).order("created_at", { ascending: false });
            if (notificationError || !notifications?.length) incomingRequestList.innerHTML = '<div class="incoming-request-table-wrap"><table class="incoming-request-table"><thead><tr><th>Patient Name</th><th>Blood</th><th>Hospital</th><th>Required Date</th><th>Status / Action</th></tr></thead><tbody><tr><td colspan="5" class="incoming-request-empty">No blood requests found</td></tr></tbody></table></div>';
            else {
                const profiles = await supabaseClient.from("profiles").select("id,full_name,email").in("id", notifications.map(item => item.blood_requests?.user_id).filter(Boolean));
                const profileById = new Map((profiles.data || []).map(profile => [profile.id, profile]));
                const donationRequests = await supabaseClient.from("blood_donation_requests")
                    .select("id,blood_request_id,status,response_id").eq("donor_user_id", currentUser.id);
                const donationRequestByResponse = new Map((donationRequests.data || []).map(request => [request.response_id, request]));
                const donationRequestByBloodRequest = new Map((donationRequests.data || []).map(request => [request.blood_request_id, request]));
                const notificationsByRequest = new Map();
                notifications.forEach(notification => {
                    const requestNotifications = notificationsByRequest.get(notification.request_id) || [];
                    requestNotifications.push(notification);
                    notificationsByRequest.set(notification.request_id, requestNotifications);
                });
                const visibleNotifications = [...notificationsByRequest.values()].map(requestNotifications => {
                    const requestId = requestNotifications[0]?.request_id;
                    const donationRequest = donationRequestByBloodRequest.get(requestId);
                    const completedNotification = requestNotifications.find(notification => notification.notification_type === "donation_completed");
                    if (donationRequest?.status === "completed") return completedNotification || requestNotifications[0] || null;
                    return requestNotifications.find(notification => notification.notification_type === "donation_request") || requestNotifications[0];
                }).filter(Boolean);
                incomingRequestList.innerHTML = `<div class="incoming-request-table-wrap"><table class="incoming-request-table"><thead><tr><th>Patient Name</th><th>Blood</th><th>Hospital</th><th>Required Date</th><th>Status / Action</th></tr></thead><tbody>${visibleNotifications.map(notification => {
                    const request = notification.blood_requests || {};
                    const sender = profileById.get(request.user_id) || {};
                    const donationRequest = donationRequestByResponse.get(notification.id) || donationRequestByBloodRequest.get(notification.request_id);
                    const status = donationRequest?.status || (notification.accepted_at ? "accepted" : notification.rejected_at ? "declined" : "pending");
                    const canDecide = status === "pending";
                    const isCompleted = status === "completed";
                    const isDeclined = status === "declined";
                    const clearButton = isCompleted || isDeclined ? `<button class="incoming-request-clear" type="button" data-cleared-request-id="${escape(notification.request_id)}">Clear</button>` : "";
                    return `<tr class="incoming-request-row" data-notification-id="${escape(notification.id)}" title="${escape(sender.full_name || "Request sender")} · Status: ${escape(status)}"><td>${escape(request.patient_name || "Patient not provided")}</td><td>${escape(request.blood_group || "Not provided")}</td><td>${escape(request.donation_center || "Hospital not provided")}</td><td>${formatDate(request.donation_date)}</td><td><strong class="incoming-request-status">${escape(status)}</strong>${isCompleted ? `<div class="donation-completed-banner">Thank you very much for donating blood.</div>` : ""}<div class="incoming-request-actions"><button class="incoming-request-details" type="button" data-request-details-id="${escape(notification.id)}">Details</button>${isCompleted || isDeclined ? clearButton : `<button class="incoming-request-accept" type="button" data-response-decision="accept" data-response-id="${escape(notification.id)}"${canDecide ? "" : " disabled"}>Accept</button><button class="incoming-request-decline" type="button" data-response-decision="decline" data-response-id="${escape(notification.id)}"${canDecide ? "" : " disabled"}>Decline</button>`}</div></td></tr>`;
                }).join("")}</tbody></table></div>`;
                incomingRequestList.querySelectorAll("[data-notification-id]").forEach(item => item.addEventListener("click", () => {
                    supabaseClient.from("blood_request_notifications").update({ read_at: new Date().toISOString() }).eq("id", item.dataset.notificationId).eq("recipient_user_id", currentUser.id);
                    item.classList.add("is-read");
                }));
                incomingRequestList.querySelectorAll("[data-cleared-request-id]").forEach(button => button.addEventListener("click", async event => {
                    event.stopPropagation();
                    button.disabled = true;
                    const { error } = await supabaseClient.from("blood_request_notifications")
                        .update({ cleared_at: new Date().toISOString() })
                        .eq("request_id", button.dataset.clearedRequestId)
                        .eq("donor_user_id", currentUser.id)
                        .eq("recipient_user_id", currentUser.id);
                    if (error) {
                        button.disabled = false;
                        if (typeof toast === "function") toast(error.message || "Unable to clear the message.", "error");
                        return;
                    }
                    await loadBloodActivity();
                }));
                incomingRequestList.querySelectorAll("[data-request-details-id]").forEach(button => button.addEventListener("click", event => {
                    event.stopPropagation();
                    const notification = notifications.find(item => item.id === button.dataset.requestDetailsId);
                    showRequestDetails(notification ? { ...notification.blood_requests, status: donationRequestByResponse.get(notification.id)?.status || donationRequestByBloodRequest.get(notification.request_id)?.status || "pending" } : null);
                }));
                incomingRequestList.querySelectorAll("[data-response-decision]").forEach(button => button.addEventListener("click", async event => {
                    event.stopPropagation();
                    button.disabled = true;
                    const decision = button.dataset.responseDecision === "accept" ? "accept" : "decline";
                    const rpcName = decision === "accept" ? "accept_incoming_blood_request" : "decline_incoming_blood_request";
                    const { error } = await supabaseClient.rpc(rpcName, { p_response_id: button.dataset.responseId });
                    if (error) {
                        button.disabled = false;
                        if (typeof toast === "function") toast(error.message || `Unable to ${decision} this request.`, "error");
                        return;
                    }
                    if (typeof toast === "function") toast(decision === "accept" ? "Request accepted and requester notified." : "Request declined.", "success");
                    await loadBloodActivity();
                }));
            }
        }

        if (!profileRequestDetailsEventsBound) {
            document.getElementById("profile-request-details-close")?.addEventListener("click", closeRequestDetails);
            document.getElementById("profile-request-details-cancel")?.addEventListener("click", closeRequestDetails);
            requestDetailsModal?.addEventListener("click", event => { if (event.target === requestDetailsModal) closeRequestDetails(); });
            requestDeleteButton?.addEventListener("click", async () => {
            if (!selectedProfileRequest || !window.confirm("Delete this blood request?")) return;
            requestDeleteButton.disabled = true;
            detail("profile-request-details-message", "Deleting request...");
            const { error } = await supabaseClient.from("blood_requests").delete().eq("id", selectedProfileRequest.id).eq("user_id", currentUser.id);
            if (error) {
                detail("profile-request-details-message", error.message || "Unable to delete this request.");
                requestDeleteButton.disabled = false;
                return;
            }
            closeRequestDetails();
            await loadOverview();
            await loadBloodActivity();
            });
            profileRequestDetailsEventsBound = true;
        }

        const { data: notifications, error: notificationError } = await supabaseClient.from("blood_request_notifications")
            .select("id,request_id,sender_user_id,donor_user_id,notification_type,status,message,created_at,read_at,accepted_at,rejected_at,cleared_at,blood_requests(patient_name,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,patient_problem)").eq("recipient_user_id", currentUser.id).is("cleared_at", null)
            .order("created_at", { ascending: false });
        const allNotifications = notifications || [];
        allNotifications.forEach(notification => knownNotificationIds.add(notification.id));
        const unreadNotifications = allNotifications.filter(notification => !notification.read_at);
        if (notificationCount) {
            notificationCount.textContent = unreadNotifications.length;
            notificationCount.hidden = unreadNotifications.length === 0;
        }
        if (notificationList) {
            notificationList.innerHTML = allNotifications.length ? allNotifications.map(notification => {
                const request = notification.blood_requests || {};
                const type = notification.notification_type || (notification.accepted_at ? "donation_accepted" : notification.rejected_at ? "donation_declined" : "donation_request");
                const title = type === "donation_request" && notification.accepted_at ? "Donation request accepted" : type === "donation_request" && notification.rejected_at ? "Donation request declined" : type === "donation_request" || type === "new_blood_request" ? "New blood donation request" : type === "donation_accepted" || type === "donation_confirmation_required" ? "Donation request accepted" : type === "donation_declined" ? "Donation request declined" : type === "donation_completed" ? "Donation completed" : "Donation update";
                const pending = type === "donation_request" && !notification.accepted_at && !notification.rejected_at;
                const confirmation = type === "donation_confirmation_required" && notification.donor_user_id !== currentUser.id;
                return `<article class="profile-notification-item${notification.read_at ? "" : " is-unread"}" data-notification-id="${escape(notification.id)}"><strong>${escape(title)}</strong><p>${escape(notification.message)}</p>${request.patient_name ? `<small>${escape(request.patient_name)} · ${escape(request.blood_group || "Blood group not provided")} · ${formatDate(request.donation_date)}</small>` : ""}<time datetime="${escape(notification.created_at)}">${escape(formatDateTime(notification.created_at))}</time><div class="profile-notification-actions"><button type="button" data-notification-view="${escape(notification.id)}">View request</button>${pending && notification.donor_user_id === currentUser.id ? `<button type="button" data-response-decision="accept" data-response-id="${escape(notification.id)}">Accept</button><button type="button" data-response-decision="decline" data-response-id="${escape(notification.id)}">Decline</button>` : confirmation ? `<button type="button" data-confirm-request-id="${escape(notification.request_id)}">Confirm donation</button>` : ""}</div></article>`;
            }).join("") : '<p class="muted">No donation notifications yet.</p>';
        }
        notificationList?.querySelectorAll("[data-notification-id]").forEach(item => item.addEventListener("click", async event => {
            if (event.target.closest("button")) return;
            if (!item.classList.contains("is-unread")) return;
            await supabaseClient.from("blood_request_notifications").update({ read_at: new Date().toISOString() }).eq("id", item.dataset.notificationId).eq("recipient_user_id", currentUser.id);
            item.classList.remove("is-unread");
            if (notificationCount) {
                const unread = notificationList.querySelectorAll(".is-unread").length;
                notificationCount.textContent = unread;
                notificationCount.hidden = unread === 0;
            }
        }));
        notificationList?.querySelectorAll("[data-notification-view]").forEach(button => button.addEventListener("click", async event => {
            event.stopPropagation();
            const item = button.closest("[data-notification-id]");
            const notification = allNotifications.find(entry => entry.id === item?.dataset.notificationId);
            if (notification && !notification.read_at) await supabaseClient.from("blood_request_notifications").update({ read_at: new Date().toISOString() }).eq("id", notification.id).eq("recipient_user_id", currentUser.id);
            showRequestDetails(notification?.blood_requests);
            await loadBloodActivity();
        }));
        notificationList?.querySelectorAll("[data-response-decision]").forEach(button => button.addEventListener("click", async event => {
            event.stopPropagation();
            button.disabled = true;
            const rpcName = button.dataset.responseDecision === "accept" ? "accept_incoming_blood_request" : "decline_incoming_blood_request";
            const { error } = await supabaseClient.rpc(rpcName, { p_response_id: button.dataset.responseId });
            if (error) {
                button.disabled = false;
                if (typeof toast === "function") toast(error.message || "Unable to update this request.", "error");
                return;
            }
            await loadBloodActivity();
        }));
        notificationList?.querySelectorAll("[data-confirm-request-id]").forEach(button => button.addEventListener("click", async event => {
            event.stopPropagation();
            button.disabled = true;
            const { data: donationRequest } = await supabaseClient.from("blood_donation_requests").select("id").eq("blood_request_id", button.dataset.confirmRequestId).eq("requester_user_id", currentUser.id).eq("status", "accepted").maybeSingle();
            if (!donationRequest) {
                button.disabled = false;
                if (typeof toast === "function") toast("This donation request is no longer available.", "error");
                return;
            }
            const { error } = await supabaseClient.rpc("mark_blood_donation_given", { p_donation_request_id: donationRequest.id });
            if (error) {
                button.disabled = false;
                if (typeof toast === "function") toast(error.message || "Unable to confirm this donation.", "error");
                return;
            }
            await loadOverview();
            await loadBloodActivity();
        }));
        if (!notificationEventsBound) markNotificationsReadButton?.addEventListener("click", async () => {
            await supabaseClient.from("blood_request_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("recipient_user_id", currentUser.id);
            await loadBloodActivity();
        });
        notificationEventsBound = true;
        if (!notificationRealtimeReady) {
            notificationRealtimeReady = true;
            notificationChannel = supabaseClient.channel(`profile-notifications-${currentUser.id}`)
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "blood_request_notifications", filter: `recipient_user_id=eq.${currentUser.id}` }, payload => {
                    if (knownNotificationIds.has(payload.new.id)) return;
                    knownNotificationIds.add(payload.new.id);
                    if (typeof toast === "function") toast(payload.new.message, "success");
                    playNotificationSound();
                    loadBloodActivity();
                })
                .subscribe();
        }
            if (!ambulanceRealtimeReady) {
                ambulanceRealtimeReady = true;
                ambulanceChannel = supabaseClient.channel(`profile-ambulance-${currentUser.id}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "ambulance_requests" }, () => loadBloodActivity())
                .subscribe();
            }
        if (!profileResponseDetailsEventsBound) {
            const closeResponseDetails = () => { if (responseDetailsModal) responseDetailsModal.hidden = true; };
            document.getElementById("profile-response-details-close")?.addEventListener("click", closeResponseDetails);
            document.getElementById("profile-response-cancel")?.addEventListener("click", closeResponseDetails);
            document.getElementById("profile-response-list")?.addEventListener("click", event => {
                const button = event.target.closest("button[data-response-decision]");
                if (!button) return;
                event.stopPropagation();
                button.disabled = true;
                updateResponseDecision(button.dataset.responseId, button.dataset.responseDecision);
            });
            responseDetailsModal?.addEventListener("click", event => { if (event.target === responseDetailsModal) closeResponseDetails(); });
            profileResponseDetailsEventsBound = true;
        }
        const responsesByRequest = (notifications || []).filter(notification => notification.request_id && notification.donor_user_id && !notification.accepted_at && !notification.rejected_at).reduce((grouped, notification) => {
            (grouped[notification.request_id] ||= []).push(notification);
            return grouped;
        }, {});
        requestList?.querySelectorAll("[data-request-id] .profile-request-response-button").forEach(button => {
            const card = button.closest("[data-request-id]");
            const responses = responsesByRequest[card?.dataset.requestId] || [];
            button.textContent = `See response (${responses.length})`;
            button.addEventListener("click", event => { event.stopPropagation(); showResponseDetails(responses); });
        });
    }

    document.getElementById("delete-donor-application-btn")?.addEventListener("click", async event => {
        if (!currentUser || !window.confirm("Delete your donor application?")) return;
        const button = event.currentTarget;
        button.disabled = true;
        const { data: deletedRows, error } = await supabaseClient
            .from("blood_donor_applications")
            .delete()
            .eq("user_id", currentUser.id)
            .select("id");
        if (error) {
            console.error("Donor application delete error:", error);
            button.disabled = false;
            alert(error.message || "Unable to delete your donor application.");
            return;
        }
        if (!deletedRows?.length) {
            button.disabled = false;
            alert("Your donor application could not be deleted. Run the donor setup SQL in Supabase first.");
            return;
        }
        localStorage.removeItem(`lifelink_donor_application_${currentUser.id}`);
        donorModal.hidden = true;
        document.getElementById("donor-form").reset();
        document.getElementById("donor-form").hidden = false;
        document.getElementById("donor-form").style.display = "";
        document.getElementById("donor-existing").hidden = true;
        document.getElementById("donor-existing").style.display = "none";
    });

    donorCloseButton.addEventListener("click", () => {
        donorModal.hidden = true;
    });

    donorModal.addEventListener("click", event => {
        if (event.target === donorModal) donorModal.hidden = true;
    });

    [profileName, profileBloodGroup].forEach(field => {
        field.addEventListener("input", updateProfileSummary);
        field.addEventListener("change", updateProfileSummary);
    });

    profileAvatarImage.addEventListener("error", () => {
        profileAvatar.classList.remove("has-image");
    });

    setEditMode(false);


    // =====================================
    // LOGOUT
    // =====================================

    async function signOut() {

            const {
                error
            } = await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Unable to sign out."
                );

                return;

            }


            window.location.href =
                "/index/login.html";
    }

    logoutButton?.addEventListener("click", signOut);
    sidebarLogoutButton?.addEventListener("click", signOut);


    // Start

    await loadProfile();
    await loadOverview();
    await loadBloodActivity();
    if (window.location.hash === "#donor-application-modal") await openDonorForm();

});