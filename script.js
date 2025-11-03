class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }

    init() {
        if (!this.form) return;

    
        this.form.querySelectorAll('[name]').forEach(field => {
            this.fields[field.name] = field;
        });

        this.setupEventListeners();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        this.form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });

        this.form.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                this.validateField(e.target);
            }
        }, true);
    }

    setupRealTimeValidation() {
        const textareas = this.form.querySelectorAll('textarea[maxlength]');
        textareas.forEach(textarea => {
            const counterId = textarea.id + '-count';
            const counter = document.getElementById(counterId);
            
            if (counter) {
                textarea.addEventListener('input', () => {
                    counter.textContent = textarea.value.length;
                });
            }
        });

      
        const fileInput = this.form.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target);
            });
        }

       
        const enquiryTypeRadios = this.form.querySelectorAll('input[name="enquiryType"]');
        if (enquiryTypeRadios.length > 0) {
            enquiryTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.updateDynamicFields(e.target.value);
                });
            });
        }
    }

    validateField(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        
        if (!field.validity.valid) {
            this.showError(field, errorElement);
            return false;
        } else {
            this.hideError(field, errorElement);
            return true;
        }
    }

    showError(field, errorElement) {
        field.style.borderColor = '#f44336';
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }

    hideError(field, errorElement) {
        field.style.borderColor = '#4CAF50';
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    validateForm() {
        let isValid = true;
        
        Object.values(this.fields).forEach(field => {
            if (field.hasAttribute('required') && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleSubmit() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        if (!this.validateForm()) {
            this.showNotification('Please fix the errors before submitting.', 'error');
            return;
        }

        submitButton.disabled = true;
        submitButton.classList.add('form-loading');
        submitButton.textContent = 'Sending...';

        try {
            const formData = new FormData(this.form);
            
            if (this.form.id === 'contact-form') {
                await this.submitContactForm(formData);
            } else if (this.form.id === 'enquiry-form') {
                await this.submitEnquiryForm(formData);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Sorry, there was an error submitting your form. Please try again.', 'error');
        } finally {
        submitButton.disabled = false;
            submitButton.classList.remove('form-loading');
            submitButton.textContent = originalText;
        }
    }

    async submitContactForm(formData) {
        const response = await this.mockAPICall(formData);
        
        if (response.success) {
            this.showNotification('Your message has been sent successfully! We\'ll get back to you within 24 hours.', 'success');
            this.form.reset();
            this.resetCharacterCounters();
            
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                successModal.classList.add('active');
            }
        } else {
            throw new Error('Submission failed');
        }
    }

    async submitEnquiryForm(formData) {
        const enquiryType = formData.get('enquiryType');
        const response = await this.mockAPICall(formData);
        
        if (response.success) {
            let message = 'Your enquiry has been submitted successfully! ';
            
            switch (enquiryType) {
                case 'product':
                    message += 'Our team will send you product information and pricing within 2 business days.';
                    break;
                case 'wholesale':
                    message += 'Our wholesale manager will contact you with bulk pricing and terms.';
                    break;
                case 'volunteer':
                    message += 'Thank you for your interest in volunteering! Our coordinator will reach out soon.';
                    break;
                case 'sponsor':
                    message += 'We appreciate your interest in sponsorship. Our partnership team will contact you.';
                    break;
                default:
                    message += 'We\'ll get back to you within 2 business days.';
            }
            
            this.showNotification(message, 'success');
            this.form.reset();
            this.resetCharacterCounters();
            this.clearDynamicFields();
        } else {
            throw new Error('Submission failed');
        }
    }

    async mockAPICall(formData) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    
        return {
            success: true,
            message: 'Form submitted successfully',
            data: Object.fromEntries(formData)
        };
    }

    updateDynamicFields(enquiryType) {
        const dynamicFields = document.getElementById('dynamic-fields');
        if (!dynamicFields) return;

        let html = '';

        switch (enquiryType) {
            case 'product':
                html = `
                    <div class="form-group">
                        <label for="product-interest" class="form-label">Products of Interest *</label>
                        <select id="product-interest" name="productInterest" class="form-select" required>
                            <option value="" disabled selected>Select products</option>
                            <option value="lip-gloss">Lip Gloss Collection</option>
                            <option value="lipstick">Lipstick Range</option>
                            <option value="lip-care">Lip Care Products</option>
                            <option value="all">All Products</option>
                            <option value="custom">Custom Selection</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="quantity" class="form-label">Estimated Quantity</label>
                        <input type="number" 
                               id="quantity" 
                               name="quantity"
                               class="form-input" 
                               placeholder="e.g., 100"
                               min="1">
                    </div>
                `;
                break;

            case 'wholesale':
                html = `
                    <div class="form-group">
                        <label for="business-type" class="form-label">Business Type *</label>
                        <select id="business-type" name="businessType" class="form-select" required>
                            <option value="" disabled selected>Select business type</option>
                            <option value="retail">Retail Store</option>
                            <option value="salon">Beauty Salon</option>
                            <option value="spa">Spa</option>
                            <option value="online">Online Store</option>
                            <option value="distributor">Distributor</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="monthly-volume" class="form-label">Estimated Monthly Volume</label>
                        <input type="text" 
                               id="monthly-volume" 
                               name="monthlyVolume"
                               class="form-input" 
                               placeholder="e.g., 500 units">
                    </div>
                `;
                break;

            case 'volunteer':
                html = `
                    <div class="form-group">
                        <label for="volunteer-role" class="form-label">Area of Interest *</label>
                        <select id="volunteer-role" name="volunteerRole" class="form-select" required>
                            <option value="" disabled selected>Select area of interest</option>
                            <option value="events">Event Support</option>
                            <option value="community">Community Outreach</option>
                            <option value="admin">Administrative</option>
                            <option value="creative">Creative/Design</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="availability" class="form-label">Availability</label>
                        <input type="text" 
                               id="availability" 
                               name="availability"
                               class="form-input" 
                               placeholder="e.g., Weekends, Evenings">
                    </div>
                `;
                break;

            case 'sponsor':
                html = `
                    <div class="form-group">
                        <label for="sponsorship-type" class="form-label">Sponsorship Type</label>
                        <select id="sponsorship-type" name="sponsorshipType" class="form-select">
                            <option value="" selected>Select type</option>
                            <option value="financial">Financial</option>
                            <option value="product">Product Donation</option>
                            <option value="event">Event Sponsorship</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                `;
                break;
        }

        dynamicFields.innerHTML = html;
        
        this.init();
    }

    clearDynamicFields() {
        const dynamicFields = document.getElementById('dynamic-fields');
        if (dynamicFields) {
            dynamicFields.innerHTML = '';
        }
    }

    handleFileUpload(fileInput) {
        const preview = document.getElementById('file-preview');
        const file = fileInput.files[0];
        
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File size must be less than 5MB', 'error');
            fileInput.value = '';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Please upload a valid file type (JPG, PNG, PDF, DOC)', 'error');
            fileInput.value = '';
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <p>${file.name}</p>
                `;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                </div>
                <p>${file.name}</p>
            `;
            preview.style.display = 'block';
        }
    }

    resetCharacterCounters() {
        const counters = this.form.querySelectorAll('.character-count span');
        counters.forEach(counter => {
            counter.textContent = '0';
        });
    }

    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <span>${message}</span>
                <button onclick="this.parentElement.remove()">&times;</button>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

class EmailHandler {
    static generateEmailLink(formData) {
        const subject = encodeURIComponent(`Website Contact: ${formData.get('subject')}`);
        const body = encodeURIComponent(`
Name: ${formData.get('name')}
Email: ${formData.get('email')}
Phone: ${formData.get('phone')}
Message Type: ${formData.get('subject')}

Message:
${formData.get('message')}

${formData.get('newsletter') ? 'Subscribed to newsletter: Yes' : 'Subscribed to newsletter: No'}
        `.trim());

        return `mailto:hello@seemahgloss.com?subject=${subject}&body=${body}`;
    }

    static openEmailClient(formData) {
        const emailLink = this.generateEmailLink(formData);
        window.open(emailLink, '_blank');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        window.contactValidator = new FormValidator('contact-form');
    }

    const enquiryForm = document.getElementById('enquiry-form');
    if (enquiryForm) {
        window.enquiryValidator = new FormValidator('enquiry-form');
    }

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^\d\s\+\-\(\)]/g, '');
        });
    });

    const nameInputs = document.querySelectorAll('input[type="text"][name="name"]');
    nameInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^A-Za-z\s\-\.']/g, '');
        });
    });
});

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (searchInput) searchInput.value = '';
    
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (window.productSearch) {
        window.productSearch.searchTerm = '';
        window.productSearch.currentCategory = 'all';
        window.productSearch.filterProducts();
    }
}