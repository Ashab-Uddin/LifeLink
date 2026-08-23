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

    function setEditMode(isEditing) {
        profileForm.classList.toggle("is-editing", isEditing);
        [profileName, profileBloodGroup, profileImage].forEach(field => {
            field.disabled = !isEditing;
        });
        editProfileButton.textContent = isEditing ? "Editing" : "Edit";
        editProfileButton.disabled = isEditing;
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

    editProfileButton.addEventListener("click", () => {
        saveCurrentValues();
        setEditMode(true);
        profileName.focus();
    });

    cancelProfileButton.addEventListener("click", () => {
        restoreSavedValues();
        showMessage("Changes discarded.");
        setEditMode(false);
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

    logoutButton.addEventListener(
        "click",
        async () => {

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
    );


    // Start

    await loadProfile();

});