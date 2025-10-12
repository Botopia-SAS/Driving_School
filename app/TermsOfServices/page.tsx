"use client";

import React from "react";

const Termspage = () => {
  return (
    <div className="min-h-screen bg-gray-100 px-0 md:px-4 py-0 md:py-10">
      {/* Simulación de header (si tienes un header real, este div no es necesario) */}
      <div className="h-20 md:h-24 w-full" />
      {/* Botón Back debajo del header, alineado a la izquierda */}
      <div className="w-full max-w-5xl mx-auto">
        <button
          onClick={() => window.close()}
          className="ml-2 md:ml-0 mb-4 flex items-center px-4 py-2 bg-white border-2 border-green-600 rounded-md text-green-600 font-semibold text-base shadow hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M12.5 15L8 10L12.5 5"
              stroke="#27ae60"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-5xl mx-auto border border-gray-300 text-black">
        <h1 className="text-5xl font-extrabold text-[#222] leading-tight">
          <span className="text-[#0056b3]">TERMS OF</span>
          <span className="text-black"> SERVICE</span>
        </h1>

        <p className="mb-4 mt-8">
          By using this website (&quot;Service&quot;) you are agreeing to be
          bound by the following terms and conditions (&quot;Terms of
          Service&quot;) with Affordable Driving Traffic School - EIN 00..
        </p>
        <p className="mb-4">
          Affordable Driving Traffic School reserves the right to update and
          change the Terms of Service without notice.
        </p>

        <p className="mb-4">
          There will not be an additional fee charged for picking up a student
          and returning to the point of starting, on our service area. A lesson
          consists of 110 minutes (a 10 minute break is taken in the middle of
          the lesson or at the end of the lesson for a break at the discretion
          of the Instructor. More than one lesson per appointment may be given.
          Once an appointment has been made, it must be cancelled or rescheduled
          48 hours in advance BY PHONE (no text or emails are accepted ) to
          avoid forfeit of the lesson or $90.00 rescheduling fee, this includes
          the first lesson, so even if student does not take the lesson, it must
          be paid for. Instructor will wait at the designated pick up location
          for a period of fifteen (15) minutes, if student cannot be reached,
          lesson is considered forfeited. If student is ill, a doctor's note is
          required to waive the fee, no exceptions. NO REFUNDS It is agreed that
          an owner, instructor, agent or employee of this school shall not give
          the impression that upon completion of the instruction that this
          school will guarantee the obtaining of a driver's license to operate a
          motor vehicle. This School will not refund any tuition or part of
          tuition since the school is ready, willing and able to fulfill its
          part of this contract. There will not be any refunds for any unused
          lessons.
        </p>
        <p className="mb-4">
          The School reserves the right to forfeit a lesson to anyone who drives
          recklessly on purpose endangering our safety and the safety of others.
          All questions must be directed to the office. Driving Instructors will
          refer you back to the office unless the question is about the
          student's lesson performance.
        </p>
        <p className="mb-4">
          If Instructor is late picking up the student, the student will get the
          full length of the lesson (110 minutes) starting at arrival time;
          reason why Instructor might be late depends on traffic/weather
          conditions and/or distance of previous student's lesson. In case the
          full length of lesson is not taught by the instructor, inform the
          office immediately, complaints will not be accepted if not reported on
          the same day.
          <br /> No one is allowed in our vehicles during driving lessons except
          for student(s) and instructor(s).
        </p>
        <p className="mb-4">
          We teach students defensive driving. Their ability to learn within one
          of our driving test may vary depending on the student's abilities. It
          is understood that upon the signing of this contract, the lessons for
          our driving test must be completed within 60 days. <br /> Safety is
          essential! Therefore, freeway driving is not mandatory and is at the
          instructor's discretion.
          <br /> There will not be any mobile phone usage or texting while
          student is in control of the car, including stopped at traffic lights.
          <br />
          If student does not have a learner's permit at the time of pickup, the
          lesson's full price must be paid. It is illegal to drive without a
          learner's permit or license, therefore the school will not to teach
          any student without a learner's permit. <br />
          If a check is returned for insufficient funds, closed account or if
          student owes any fees to the school, there will be a fee of $50 fee
          plus any legal fees required to collect payment, if attempts to
          collect fail, we will prosecute.
          <br /> We are a Third Party Agency Authorized by the Florida
          Department of Motor Vehicles to give the Road Test. The Test is given
          at our facility. The fee for this service is $100. (If the test cannot
          be taken for a reason other than the school's fault, the full fee must
          be paid). No refunds will be given if the student fails the driving
          tests.
        </p>
        <p className="mb-4">
          The student/parent/guardian understands and agrees that they are
          responsible for damages, including collisions that occur during
          driving tests while the student is in control of the vehicle. The
          Student/Parent/Guardian understands and agrees that certain hazards
          and risks are inherent in the operation of a motor vehicle. The
          Student does hereby specifically assume all risks as they may incurred
          in the normal operation of a motor vehicle during the driving lesson.
          All vehicles are fully covered with Liability insurance. The
          student/parent/guardian hereby FULLY and COMPLETELY releases the
          School, its agents and employees, from any liability whatsoever, and
          from ANY and ALL claims or action resulting or arising from any damage
          or injuries including death suffered by the Student during this course
          or any extension thereof, to the extent that such claims shall be
          covered by the School's insurance coverage. The
          student/parent/guardian hereby further agrees to indemnify and hold
          the School harmless from any claims made against it for any damage or
          injury suffered by any person, company, corporation or other entity,
          growing out of the Student's operation of a School vehicle, or as a
          result of the Student's course of instruction, to the extent that such
          a claim is not covered by the School's Insurance coverage. This
          agreement shall be effective and binding upon the student's heirs,
          next of kin, executors, administrators, assigns and representatives,
          in the event of the student's death or incapacity. Affordable Driving
          Traffic School is licensed by the State of Florida Department Highway
          Safety and Motor Vehicles. This contract constitutes the entire
          agreement between the School and the Student and no verbal assurances
          or promises not contained herein shall be recognized
        </p>

        <h2 className="text-xl font-bold mt-6">Account Terms</h2>
        <p className="mb-4">
          This page contains the most current version of the Terms of Service.
        </p>
        <ul className="list-disc ml-6">
          <li>
            Accounts registered by &quot;bots&quot; or other automated methods
            are not permitted and will be removed.
          </li>
          <li>
            You are responsible for all activity that occurs from your account.
          </li>
          <li>
            You agree that Affordable Driving Traffic School can send you
            booking reminders, relevant information and other marketing via
            phone, SMS and/or email. You can opt out of any marketing.
          </li>
          <li>You must not post or submit false information to the Service.</li>
          <li>
            You are responsible for maintaining the security of your account and
            password. Affordable Driving Traffic School cannot and will not be
            liable for any loss or damage from your failure to comply with this
            security obligation.
          </li>
          <li>
            You must not use the Service for any illegal or unauthorised
            purpose. You must not use this Service to violate any laws in your
            jurisdiction, including but not limited to copyright laws.
          </li>
          <li>
            Affordable Driving Traffic School has the right to suspend or
            terminate your account, refuse any current or future use of the
            Service, or any other Affordable Driving Traffic School service, for
            any reason.
          </li>
          <li>
            Violation of any of the terms or general conditions may result in
            the termination of your Account.
          </li>
        </ul>

        <h2 className="text-xl font-bold mt-6 mb-4">Cancellation Policy</h2>
        <p className="mb-4">
          Less than 48 hours notice before the booking will forfeit the full
          booking fee.
        </p>
        <p>
          A cancellation does not automatically refund payment of products or
          services. Any amount not subject to the cancellation fee, is credited
          towards your account balance at Affordable Driving Traffic School.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-4">
          Modifications to Services and Prices
        </h2>
        <li>
          Affordable Driving Traffic School reserves the right at any time and
          from time to time to modify or discontinue, temporarily or
          permanently, the Service (or any part thereof) with or without notice.
        </li>
        <li>
          Prices of all Services are subject to change with or without notice.
        </li>
        <li>
          Affordable Driving Traffic School shall not be liable to you or to any
          third party for any modification, price change, suspension or
          discontinuance of the Service
        </li>
        <h2 className="text-xl font-bold mt-6 mb-4">Pre Paids</h2>
        <li>Pre Paids are non-refundable and cannot be redeemed for cash.</li>
        <li>Unused pre paids cannot be transferred between clients.</li>
        <li>Pre Paids are valid for 6 months from the date of purchase.</li>

        <h2 className="text-xl font-bold mt-6 mb-4">Fees</h2>
        <li>
          Credit card security is implemented using secure SSL encryption on all
          transactions and processed using a secure, trusted, PCI compliant
          payment gateway and used by Affordable Driving Traffic School for
          payment processing.
        </li>
        <li>All fees and transactions are in United States Dollars.</li>

        <h2 className="text-xl font-bold mt-6 mb-4">General Conditions</h2>
        <ul className="list-disc ml-6">
          <li>
            Your use of this website is at your sole risk. The website is
            provided on an &quot;as is&quot; and &quot;as available&quot; basis.
          </li>
          <li>
            ou agree not to reproduce, duplicate, copy, sell, resell or exploit
            any portion of the website, use of the website, or access to the
            website without the express written permission by Affordable Driving
            Traffic School.
          </li>
          <li>
            Verbal, physical, written or other abuse (including threats of abuse
            or retribution) of any Affordable Driving Traffic School customer,
            employee, member, instructor, officer or external contractor will
            result in immediate account termination.
          </li>
          <li>
            You must not transmit any worms or viruses or any code of a
            destructive nature.
          </li>
          <li>
            You understand that Affordable Driving Traffic School uses third
            party vendors and hosting partners to provide the necessary
            hardware, software, networking, storage, and related technology
            required to run.
          </li>
          <li>
            Affordable Driving Traffic School does not warrant that (i) the
            website will meet your specific requirements, (ii) the website will
            be uninterrupted, timely, secure, or error-free, (iii) the results
            that may be obtained from the use of the website will be accurate or
            reliable, (iv) the quality of any products, websites, information,
            or other material purchased or obtained by you through the website
            will meet your expectations, and (v) any errors in the website will
            be corrected.
          </li>
          <li>
            You expressly understand and agree that Affordable Driving Traffic
            School shall not be liable for any direct, indirect, incidental,
            special, consequential or exemplary damages, including but not
            limited to, damages for loss of profits, goodwill, use, data or
            other intangible losses (even if Affordable Driving Traffic School
            has been advised of the possibility of such damages), resulting
            from: (i) the use or the inability to use the website; (ii) the cost
            of procurement of substitute goods and services resulting from any
            goods, data, information or services purchased or obtained or
            messages received or transactions entered into through or from the
            website; (iii) unauthorised access to or alteration of your
            transmissions or data; (iv) statements or conduct of any third party
            on the website; (v) or any other matter relating to the website.
          </li>
          <li>
            The failure of Affordable Driving Traffic School to exercise or
            enforce any right or provision of the Terms of website shall not
            constitute a waiver of such right or provision.
          </li>
        </ul>

        <h2 className="text-xl font-bold mt-6">Questions</h2>
        <p>
          Contact us at{" "}
          <a
            href="mailto:info@drivingschoolpalmbeach.com"
            className="text-blue-600 hover:underline"
          >
            info@drivingschoolpalmbeach.com
          </a>{" "}
          for any inquiries.
        </p>
      </div>
    </div>
  );
};

export default Termspage;
