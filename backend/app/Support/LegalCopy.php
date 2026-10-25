<?php

namespace App\Support;

use App\Models\Page;

class LegalCopy
{
    public const PLACEHOLDERS = [
        '[COMPANY LEGAL NAME]',
        '[REGISTERED ADDRESS]',
        '[REGISTRATION NUMBER]',
        '[DPC REGISTRATION NUMBER]',
        '[CONTACT EMAIL]',
        '[PHONE]',
        '[EFFECTIVE DATE]',
        '[REFUND POLICY DETAILS]',
        '[IP ADDRESS RETENTION PERIOD]',
        '[HOSTING AND MAIL LOCATION]',
    ];

    /**
     * @return list<array{title: string, slug: string, excerpt: string, body: string}>
     */
    public static function pages(): array
    {
        return [
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy',
                'excerpt' => 'How Marqetise handles personal data collected by this website and the staff admin.',
                'body' => self::privacy(),
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms',
                'excerpt' => 'The terms for using the Marqetise website, enquiry forms, and consultation requests.',
                'body' => self::terms(),
            ],
        ];
    }

    /**
     * @param  array{title: string, slug: string, excerpt: string, body: string}  $page
     * @return array<string, mixed>
     */
    public static function attributes(array $page): array
    {
        return [
            'title' => $page['title'],
            'slug' => $page['slug'],
            'excerpt' => $page['excerpt'],
            'body' => $page['body'],
            'status' => 'published',
            'published_at' => now(),
            'meta_title' => $page['title'].' · Marqetise',
            'meta_description' => $page['excerpt'],
        ];
    }

    public static function isReplaceable(?object $page): bool
    {
        if ($page === null) {
            return true;
        }

        $body = (string) ($page->body ?? '');
        $status = (string) ($page->status ?? '');

        if (str_contains($body, 'Add the finished privacy policy') || str_contains($body, 'Add the finished terms of use')) {
            return true;
        }

        return $status === 'draft' && trim($body) === '';
    }

    public static function publish(): void
    {
        foreach (self::pages() as $page) {
            $existing = Page::query()->where('slug', $page['slug'])->first();

            if ($existing !== null && ! self::isReplaceable($existing)) {
                continue;
            }

            Page::query()->updateOrCreate(
                ['slug' => $page['slug']],
                self::attributes($page),
            );
        }
    }

    public static function privacy(): string
    {
        return <<<'TEXT'
This notice describes personal data handled by the Marqetise website and staff admin. The site is operated under the name Marqetise by [COMPANY LEGAL NAME]. Have a lawyer qualified in Ghana review this page before you rely on it. Effective date: [EFFECTIVE DATE].

# Who we are

Marqetise is the name on this website for a digital marketing agency and a training business. The legal entity is [COMPANY LEGAL NAME], registration number [REGISTRATION NUMBER], of [REGISTERED ADDRESS]. Phone: [PHONE]. Privacy requests: [CONTACT EMAIL].

The Data Protection Act, 2012 (Act 843) requires a data controller to register with the Data Protection Commission before processing personal data (sections 27, 46, and 53). Our Data Protection Commission registration number is [DPC REGISTRATION NUMBER]. Registration particulars include the countries to which data may be transferred (section 47).

# What this application stores

This notice lists only records the application stores. The public pages do not load a third-party analytics or advertising script. There is no analytics cookie and no advertising cookie. The services list can include an offering named Analytics. That is a service description, not a tracker on this website. The public pages do not use browser local storage or session storage.

Contact and course enquiries. The home enquiry form and the contact form post to the inquiry API. A saved enquiry stores the type (marketing services, website development, course, corporate training, or other), name, email address, phone number if you enter one, subject, message, the published course when the type is a course, a consent flag, a status, and the IP address Laravel reports for that request. A hidden spam field is checked and is not saved. Staff can add an internal note later. A course enquiry does not take payment and does not reserve a place. Staff can create a student record from an enquiry. That record copies the name, email, phone, and course, and it keeps a link to the enquiry.

Other pages that reuse the enquiry form, including a team contact form and a comment form, post to the same API. A row is stored only when the required fields pass validation. Subject and message are required. The message must be at least 20 characters. Where the form has a consent checkbox, it must be ticked.

Consultation requests. The booking API stores a reference, the service name, name, email, phone, company, website, budget, the goals text, the format (video call, phone, or office), the preferred date and time, a consent flag, and the status. It does not store an IP address. The request stays pending until a staff member confirms it. It does not confirm the appointment by itself. The current public HTML pages do not include a booking form. The API and the admin bookings screen still exist.

Student records. Staff store a name, email, phone, status (waitlist, active, completed, or withdrawn), course, enrolment date, notes, and, when the record came from an enquiry, the enquiry link. There is no payment checkout and no separate online enrolment.

Staff accounts. A staff record stores a name, email, optional phone, a hash of the password rather than the password itself, a role, a status, and the time of the last sign-in. A password reset stores the email and a token. Signing in can set a remember-me cookie. Staff actions write an audit row with the action, a short note such as a role or status, and the IP address Laravel reports. Deleting a user stores that email address in the audit note. A refused sign-in writes a log line with a SHA-256 hash of the email and a reason. That line does not store the raw email or the IP address. The sign-in limiter keeps a cache key made from the email and IP for 15 minutes after a failed attempt, and a separate limit allows five sign-in posts per minute for that email and IP. Enquiry posts are limited to five per minute for the IP. Those cache entries are not enquiry records.

Sessions and cookies. Submitting a form first requests a CSRF cookie named XSRF-TOKEN so the browser can send the matching header. That cookie is not a tracking cookie. The session cookie name is the slug of the application name followed by -session. With APP_NAME set to Marqetise, the name is marqetise-session. It is HTTP-only. SameSite is lax. The session payload is encrypted. Production startup refuses an insecure session cookie. The idle lifetime defaults to 120 minutes, and the cookie is not removed merely because the browser window closes. A session row can store the IP address and the browser user agent until that idle lifetime passes. Expired session rows are eligible for deletion on about 2 in every 100 requests. If a staff member ticks Remember me, a separate cookie whose name starts with remember_ lasts 14 days. It does not contain the password.

Email. When a mail transport is configured, the application sends the enquiry or booking to the staff notification address and a receipt to the address you typed. Staff invitations and password resets use the same transport. The repository does not name the mail host.

Uploads. A staff member can upload a JPEG, PNG, or WebP image up to 5 MB. The file, original file name, type, size, and uploading account are stored.

The footer newsletter box asks for an email address and shows a privacy checkbox. It is not connected to the inquiry API. An address typed there is not stored and does not start a subscription.

# Why we use the data

We use an enquiry or booking to reply and to arrange the conversation you asked for. We use a student or staff record to run the training record or the account a staff member created. The consent checkbox is permission to contact you about that enquiry or request. It is required before the form is accepted. Section 20 of Act 843 also allows processing without consent where it is necessary for a contract with you, authorised or required by law, needed to protect your legitimate interest, needed for a statutory duty, or needed for a legitimate interest of the controller that does not override your rights. Securing the site is the legitimate interest we rely on for rate limits, the spam field, and security logs.

Section 21 says personal data is collected from you. We do that through the forms and account screens. Sections 22 and 23 require a specific, lawful purpose and require us to make you aware of it. This page is that notice. Section 19 says we process only what is necessary for the purpose. Section 25 says a later use must be compatible with the original purpose, or you consent, or the Act allows it. Section 26 requires the record to be complete, accurate, and not misleading for that purpose. Tell us if a detail is wrong.

# Marketing and how to opt out

Section 40 of Act 843 says direct marketing includes advertising directed to a particular person, and it requires prior written consent. It also lets you, at any time and in writing, require us to stop processing your data for direct marketing.

This website does not keep a mailing list. There is no unsubscribe link because there is no list to leave. The consent checkbox is only permission to contact you about the enquiry or request you sent. It is not consent to a newsletter.

To stop marketing messages, email [CONTACT EMAIL] from the address you used, or write to [REGISTERED ADDRESS]. We will stop using your details for direct marketing. We may still contact you about an open enquiry, a booking you requested, a course request, a staff account, or a duty the law imposes.

Section 20 lets you object to other processing. Where that objection applies, processing stops. Section 39 lets you require us to stop processing that causes or is likely to cause unwarranted damage or distress. We will answer that notice within 21 days, which is the period in section 39, either to say we will comply or to give reasons.

# How long we keep it

Section 24 of Act 843 says a controller must not keep personal data longer than necessary for the purpose, unless the law, a contract, your consent, or another ground in that section allows a longer period. When the period ends, the record must be destroyed, deleted, or de-identified so it cannot be reconstructed.

Session rows follow the session lifetime described above. The remember-me cookie lasts 14 days. Sign-in limiter entries last 15 minutes. Refused-sign-in log lines go to the application log. The application does not delete those log lines on a schedule.

Inquiry IP addresses, audit-log IP addresses, and the enquiry, booking, student, and staff rows are not deleted on a schedule. The application does not enforce a retention period for them. The period we will apply is [IP ADDRESS RETENTION PERIOD]. Until that placeholder is replaced with a real period and a deletion process is added, those rows remain until a staff member deletes them or the operator removes them from the database.

# Your rights

You may ask us to confirm whether we hold personal data about you, to describe it, including the category of recipient who has had access, and to correct it (section 32). You may ask us to correct or delete data that is inaccurate, irrelevant, excessive, out of date, incomplete, misleading, or obtained unlawfully, or to delete a record we no longer have authority to keep (section 33). You may object to processing (section 20). You may opt out of direct marketing (section 40). You may require that a decision which significantly affects you is not based solely on automatic processing (section 41). This website does not decide enrolment, hiring, or a contract by automatic means.

Write to [CONTACT EMAIL]. We may ask you to show that you control the email address, so the record is not sent to the wrong person. Where Act 843 sets a time, we will meet it. Where it does not, we aim to reply within 30 days. If we do not make a correction you asked for, you may ask us to mark the record with that request, as section 33 describes. You can also complain to the Data Protection Commission.

# Security

Section 28 requires appropriate, reasonable, technical and organisational measures against loss, damage, unauthorised destruction, and unauthorised access. The measures in this application include hashed staff passwords, encrypted session payloads, HTTP-only session cookies, a CSRF check on state-changing requests, permission checks on the server, and a production startup that refuses a public debug display and an insecure session cookie. A staff password must be at least 12 characters and include upper and lower case, a number, and a symbol. This repository does not turn on encryption of the database at rest. That depends on the host.

If there are reasonable grounds to believe an unauthorised person has accessed personal data, section 31 requires notice to the Data Protection Commission and to you as soon as reasonably practicable, unless a security agency or the Commission says notice would impede a criminal investigation. The notice is by registered mail, email, a website notice, the media, or another method the Commission directs.

The Cybersecurity Act, 2020 (Act 1038) establishes the Cyber Security Authority and duties for cybersecurity incidents, including duties for critical information infrastructure. This repository does not record a designation of this website as critical information infrastructure. Where Act 1038 requires a report, we will also report the incident to the Cyber Security Authority.

# Data outside Ghana

This repository does not name the country of the database or the mail provider. That location is [HOSTING AND MAIL LOCATION]. If a processor is outside Ghana, section 30 requires a written contract and requires the processor to meet Ghana's confidentiality and security duties. The countries to which data may be transferred are part of the Data Protection Commission registration (section 47). We do not send personal data to an analytics vendor. Email can leave Ghana only when the configured mail host is outside Ghana.

# Children and special data

The forms do not ask for a date of birth. They are for business and training enquiries. Do not include information about a child unless you are the parent or guardian and the message cannot be handled without it.

The forms do not ask for health, religious, ethnic, biometric, or other special personal data. Section 37 restricts processing of that data. Please keep it out of the message. If it is included, we use it only to handle that message, and you may ask us to delete it.

# Changes

We change this page when the collection changes, and we change the effective date with it. Staff can edit the page in the content manager. Words in square brackets are facts this repository does not contain. They are not finished company details.
TEXT;
    }

    public static function terms(): string
    {
        return <<<'TEXT'
These terms cover use of the Marqetise website, its enquiry forms, and a consultation request sent through the booking API. The site is operated under the name Marqetise by [COMPANY LEGAL NAME]. Have a lawyer qualified in Ghana review this page before you rely on it. Effective date: [EFFECTIVE DATE].

# The site

You may read the public pages and send an enquiry. Staff admin is only for people we authorise. The privacy notice, linked as the Privacy Policy, explains personal data. Read it with these terms. The Electronic Transactions Act, 2008 (Act 772) gives legal recognition to electronic information and to contracts formed by electronic communication. A message is not invalid only because it is electronic.

# No payment on this website

Sending an enquiry does not create a paid contract, does not take a payment, and does not reserve a course place. A consultation request, where the booking API is used, stays pending until a staff member confirms the time. It is not a confirmed appointment. A price shown on a course page is information. It is not a checkout. Fees, scope, and dates are agreed afterwards, in writing or by email. When that later agreement is electronic, Act 772 is the law that lets it be recognised. The refund position for a fee agreed outside this website is [REFUND POLICY DETAILS]. This website has no refund control because it does not take the payment.

# Enquiries

Give a name and an email address you can read. The message must be at least 20 characters, and the subject is required. Tick the consent box where the form shows one. A booking request, if you send one, must use a weekday that is today or later and one of the listed times. One pending or confirmed booking holds that time. We may refuse a submission that fails those checks, that repeats the spam field, or that we cannot answer.

Do not send unlawful content, another person's confidential information, or special personal data you have no right to share.

# Staff accounts

There is no public registration. An authorised person creates a staff account, and the new person sets a password from an invitation when email delivery is configured. Keep that password private. We may suspend an account that is misused or no longer authorised. A staff password must be at least 12 characters and include upper and lower case, a number, and a symbol.

# Intellectual property

The text, marks, and layout of this website belong to [COMPANY LEGAL NAME] or are used with permission. You may read the pages and share a link to them. You may not copy the site or course materials for a competing service without written permission. Materials for a course are for the people accepted onto that course, on the terms agreed at that time. This repository does not contain a separate licence for those materials.

# Liability

Pages describe work a person will review. They do not promise a search ranking, a revenue figure, a job, or any particular result. To the extent Ghanaian law allows, we are not liable for loss caused by relying on a public page, by an email that was not delivered, or by a request that was not confirmed. These terms do not limit liability that the law of Ghana does not allow us to limit, including liability for fraud or compensation that the Data Protection Act, 2012 (Act 843) provides for a failure to comply.

# Availability

We may suspend a form or an account to protect the site or other people. The sign-in limit and the enquiry limit are security controls. Reaching a limit is not something you can pay to remove.

# Law and courts

The laws of the Republic of Ghana govern these terms. The courts of Ghana have jurisdiction. Act 772 applies to electronic messages and electronic contracts. Act 843 applies to personal data. The Cybersecurity Act, 2020 (Act 1038) applies where a cybersecurity duty in that Act is triggered. If a court holds one sentence unenforceable, the rest remains in force.

# Contact

[COMPANY LEGAL NAME], [REGISTERED ADDRESS]. Phone: [PHONE]. Email: [CONTACT EMAIL]. Registration number: [REGISTRATION NUMBER].

# Changes

We may replace these terms by publishing a new version on this page and changing the effective date. Sending a new enquiry after that date accepts the new version for that enquiry. An agreement already made by email keeps the terms that applied when it was made, unless you and we change it.
TEXT;
    }
}
