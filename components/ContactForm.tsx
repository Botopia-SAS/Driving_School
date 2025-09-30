"use client";

import { useState } from "react";
import Image from "next/image";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    subject: "General Inquiry",
    inquiry: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.subject.trim() !== ""
    );
  };

  const subjects = [
    "General Inquiry",
    "Account Inquiry",
    "Reschedule a booking",
    "Cancel a booking",
    "12hr Advanced Driving Improvement Class",
    "12hr Advanced Driving Improvement Multi Day",
    "3 Crashes in 3 Years",
    "4 hr Basic Driving Improvement Class",
    "4 hr / 8 hr Youthful Offender Class",
    "4hr Traffic Law & Substance Abuse Class",
    "8 hr Aggressive Driving Improvement Class",
    "8hr Court Ordered IDI Intermediate Driving Improvement Class",
    "Corporate Programs",
    "Driving Lessons",
    "Driving Test",
    "Senior Insurance Discount",
    "Written Test",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setMessage("❌ Maximum 5 images allowed");
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const convertImagesToBase64 = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const base64Images: string[] = [];

    for (const image of images) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        base64Images.push(base64);
      } catch (error) {
        console.error("Error converting image to base64:", error);
      }
    }

    return base64Images;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Convert images to base64
      setUploadingImages(true);
      const base64Images = await convertImagesToBase64();
      setUploadingImages(false);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: base64Images,
        }),
      });

      if (!res.ok) {
        throw new Error("Error sending contact form");
      }

      setMessage("✅ Form submitted successfully! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        subject: "General Inquiry",
        inquiry: "",
      });
      setImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setMessage("❌ Failed to submit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 📌 CONTENEDOR PRINCIPAL EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 🔹 Formulario */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
            <p className="text-gray-600">We'll get back to you within 24 hours</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email Address *</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">City</label>
              <input
                type="text"
                name="city"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            {/* Subject (Dropdown) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Subject *</label>
              <select
                name="subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                value={formData.subject}
                onChange={handleChange}
              >
                {subjects.map((subject, index) => (
                  <option key={index} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Inquiry (Text Area) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Message</label>
              <textarea
                name="inquiry"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Tell us how we can help you..."
                value={formData.inquiry}
                onChange={handleChange}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Attach Images (Optional - Max 5)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  disabled={images.length >= 5}
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                    images.length >= 5
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                  }`}
                >
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-700 font-medium">
                    {images.length >= 5 ? 'Maximum images reached' : 'Click to upload images'}
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading || uploadingImages || !isFormValid()}
              >
                {uploadingImages ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading Images...
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Message...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>

            {message && (
              <div className={`text-center p-4 rounded-lg font-semibold ${
                message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* 🔹 Información de Contacto */}
        <div className="bg-blue-600 text-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Image
              src="/DV-removebg-preview.png"
              alt="Logo"
              width={120}
              height={120}
              className="mx-auto mb-4 bg-white rounded-full p-4 shadow-lg"
            />
            <h3 className="text-2xl font-bold mb-2">
              Affordable Driving Traffic School
            </h3>
            <p className="text-blue-100">Your trusted driving education partner</p>
          </div>

          <div className="space-y-6">
            {/* Phone Numbers */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">561 735 1615</p>
                <p className="text-blue-100 text-sm">Primary Phone</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">561 330 7007</p>
                <p className="text-blue-100 text-sm">Secondary Phone</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <a 
                  href="mailto:info@drivingschoolpalmbeach.com"
                  className="font-semibold text-lg hover:text-blue-200 transition-colors"
                >
                  info@drivingschoolpalmbeach.com
                </a>
                <p className="text-blue-100 text-sm">Email Address</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-3 rounded-full mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Our Location</p>
                <p className="text-blue-100">
                  3167 Forest Hill Blvd West<br />
                  Palm Beach, Florida 33406
                </p>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <h4 className="font-bold text-lg mb-3">Business Hours</h4>
            <div className="space-y-1 text-blue-100">
              <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
              <p>Saturday: 9:00 AM - 4:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
