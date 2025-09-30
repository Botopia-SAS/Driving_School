interface EmailTemplateProps {
  name: string;
  email: string;
  phone: string;
  city?: string;
  subject: string;
  inquiry: string;
  images?: string[];
}

export const generateContactEmailTemplate = ({
  name,
  email,
  phone,
  city,
  subject,
  inquiry,
  images = [],
}: EmailTemplateProps): string => {
  const logoUrl = "https://res.cloudinary.com/dgnqk0ucm/image/upload/v1758091374/logo_1_iol4hm.png";

  return `
    <div style="background: #f6f8fa; padding: 0; min-height: 100vh;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden;">
        <!-- Header -->
        <div style="background: #2346a0; padding: 32px 0 24px 0; text-align: center;">
          <div style="background: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 16px auto; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); overflow: hidden;">
            <img src="${logoUrl}" alt="Logo" width="78" height="78" style="display: block; border-radius: 50%; object-fit: cover;" />
          </div>
          <h1 style="color: #fff; font-size: 2rem; margin: 0; font-family: Arial, sans-serif; letter-spacing: 1px;">
            New Contact Request
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 36px 32px 24px 32px; font-family: Arial, sans-serif; color: #222;">
          <h2 style="color: #0056b3; margin-top: 0; font-size: 1.5rem;">📩 Contact Form Submission</h2>

          <div style="background: #f0f6ff; border-left: 4px solid #2346a0; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; color: #555; font-size: 1rem;">Someone has contacted you through the website contact form.</p>
          </div>

          <!-- Contact Information -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
              <div style="color: #2346a0; font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">👤 Name</div>
              <div style="color: #333; font-size: 1.1rem;">${name}</div>
            </div>

            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
              <div style="color: #2346a0; font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">📧 Email</div>
              <div style="color: #333; font-size: 1.1rem;"><a href="mailto:${email}" style="color: #0056b3; text-decoration: none;">${email}</a></div>
            </div>

            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
              <div style="color: #2346a0; font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">📞 Phone</div>
              <div style="color: #333; font-size: 1.1rem;"><a href="tel:${phone}" style="color: #0056b3; text-decoration: none;">${phone}</a></div>
            </div>

            ${city ? `
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
              <div style="color: #2346a0; font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">📍 City</div>
              <div style="color: #333; font-size: 1.1rem;">${city}</div>
            </div>
            ` : ''}

            <div style="margin-bottom: 0;">
              <div style="color: #2346a0; font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">📋 Subject</div>
              <div style="color: #333; font-size: 1.1rem; font-weight: bold;">${subject}</div>
            </div>
          </div>

          <!-- Message -->
          <div style="background: #fff; border: 2px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #2346a0; margin-top: 0; margin-bottom: 12px; font-size: 1.1rem;">💬 Message</h3>
            <p style="margin: 0; line-height: 1.6; color: #333; font-size: 1rem;">${inquiry || 'No message provided.'}</p>
          </div>

          <!-- Attached Images -->
          ${images.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <h3 style="color: #2346a0; margin-bottom: 16px; font-size: 1.2rem;">📸 Attached Images (${images.length})</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              ${images.map((imageUrl, index) => `
                <div style="border: 2px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
                  <a href="${imageUrl}" target="_blank">
                    <img src="${imageUrl}" alt="Attachment ${index + 1}" style="width: 100%; height: auto; display: block;" />
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Call to Action -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="mailto:${email}" style="display: inline-block; background: #2346a0; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 1rem;">Reply to ${name}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #0056b3, #000); color: white; padding: 32px 24px; border-radius: 0 0 36px 36px; text-align: center;">
          <div style="background: white; border-radius: 50%; width: 65px; height: 65px; margin: 0 auto 16px auto; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); overflow: hidden;">
            <img src='${logoUrl}' alt='Logo' width='63' height='63' style='display: block; border-radius: 50%; object-fit: cover;' />
          </div>
          <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 8px;">Affordable Driving<br/>Traffic School</div>
          <div style="margin-bottom: 8px; font-size: 1rem;">
            West Palm Beach, FL | <a href="mailto:info@drivingschoolpalmbeach.com" style="color: #fff; text-decoration: underline;">info@drivingschoolpalmbeach.com</a> | 561 330 7007
          </div>
          <div style="font-size: 12px; color: #ccc;">&copy; ${new Date().getFullYear()} Powered By Botopia Technology S.A.S</div>
        </div>
      </div>
    </div>
  `;
};