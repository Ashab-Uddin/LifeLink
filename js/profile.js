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

    profileViewLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            const view = link.dataset.profileView || "overview";
            history.replaceState(null, "", `#${link.getAttribute("href").slice(1)}`);
            showProfileView(view);
            if (view === "blood-requests") loadBloodActivity();
            document.querySelector(`[data-profile-content~="${view}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    profileHeroEditButton?.addEventListener("click", () => {
        showProfileView("achievements");
        document.getElementById("profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        editProfileButton?.click();
    });

    showProfileView("overview");

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
            .select("gender,last_donation_date")
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error || !donorApplication?.last_donation_date) return;

        const lastDonation = new Date(`${donorApplication.last_donation_date}T00:00:00`);
        if (Number.isNaN(lastDonation.getTime())) return;

        const requiredMonths = String(donorApplication.gender).toLowerCase() === "male" ? 4 : 6;
        const eligibleDate = new Date(lastDonation);
        eligibleDate.setMonth(eligibleDate.getMonth() + requiredMonths);
        overviewLastDonation.textContent = `Last donation: ${lastDonation.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;

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

    async function loadBloodActivity() {
        const requestList = document.getElementById("profile-blood-requests");
        if (!currentUser || !requestList) return;
        const escape = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
        const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "Not provided";
        const formatTime = value => value ? value.slice(0, 5) : "Not provided";
        const formatDateTime = value => value ? new Date(value).toLocaleString() : "Not provided";
        const requestDetailsModal = document.getElementById("profile-request-details-modal");
        const requestDeleteButton = document.getElementById("profile-request-delete");
        const responseDetailsModal = document.getElementById("profile-response-details-modal");
        const detail = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value || "Not provided";
        };
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
            detail("profile-request-details-status", request.status || "open");
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
            .select("id,request_id,donor_user_id,message,created_at,read_at,accepted_at,rejected_at").eq("recipient_user_id", currentUser.id)
            .order("created_at", { ascending: false });
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
        requestList.querySelectorAll("[data-request-id] .profile-request-response-button").forEach(button => {
            const card = button.closest("[data-request-id]");
            const responses = responsesByRequest[card?.dataset.requestId] || [];
            button.textContent = `See response (${responses.length})`;
            button.addEventListener("click", event => { event.stopPropagation(); showResponseDetails(responses); });
        });
        if (!notificationError && notifications?.length) {
            const unreadIds = notifications.filter(notification => !notification.read_at).map(notification => notification.id);
            const latestUnread = notifications.find(notification => !notification.read_at);
            const notificationKey = `lifelink_profile_notification_${currentUser.id}`;
            if (latestUnread && localStorage.getItem(notificationKey) !== latestUnread.id) {
                localStorage.setItem(notificationKey, latestUnread.id);
                if (typeof toast === "function") toast(latestUnread.message, "success");
                if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
                if ("Notification" in window && Notification.permission === "granted") new Notification("LifeLink donor response", { body: latestUnread.message });
            }
            if (unreadIds.length) await supabaseClient.from("blood_request_notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
        }
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
    window.setInterval(loadBloodActivity, 30000);
    if (window.location.hash === "#donor-application-modal") await openDonorForm();

});