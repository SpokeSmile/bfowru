import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import FeedbackEntry


class FeedbackApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='feedback-user', password='secret-pass')
        self.url = reverse('api_feedback_create')

    def post_feedback(self, payload, **headers):
        return self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json',
            **headers,
        )

    def test_feedback_requires_login(self):
        response = self.post_feedback({
            'type': FeedbackEntry.BUG,
            'message': 'Schedule cell is broken.',
        })

        self.assertEqual(response.status_code, 302)
        self.assertFalse(FeedbackEntry.objects.exists())

    def test_logged_in_user_can_create_feedback(self):
        self.client.login(username='feedback-user', password='secret-pass')

        response = self.post_feedback(
            {
                'type': FeedbackEntry.FEATURE,
                'message': 'Add team notifications.',
                'pageUrl': 'https://bfow.vercel.app/',
            },
            HTTP_USER_AGENT='Feedback browser',
        )

        self.assertEqual(response.status_code, 201)
        feedback = FeedbackEntry.objects.get()
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.type, FeedbackEntry.FEATURE)
        self.assertEqual(feedback.message, 'Add team notifications.')
        self.assertEqual(feedback.page_url, 'https://bfow.vercel.app/')
        self.assertEqual(feedback.user_agent, 'Feedback browser')
        self.assertEqual(feedback.status, FeedbackEntry.NEW)

    def test_rejects_empty_message(self):
        self.client.login(username='feedback-user', password='secret-pass')

        response = self.post_feedback({
            'type': FeedbackEntry.BUG,
            'message': '   ',
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('message', response.json()['errors'])
        self.assertFalse(FeedbackEntry.objects.exists())

    def test_rejects_invalid_type(self):
        self.client.login(username='feedback-user', password='secret-pass')

        response = self.post_feedback({
            'type': 'idea',
            'message': 'Something useful.',
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('type', response.json()['errors'])
        self.assertFalse(FeedbackEntry.objects.exists())


class FeedbackAdminTests(TestCase):
    def test_admin_exposes_editable_status_and_note(self):
        from django.contrib import admin

        from .admin import FeedbackEntryAdmin

        admin_instance = FeedbackEntryAdmin(FeedbackEntry, admin.site)

        self.assertIn('status', admin_instance.fields)
        self.assertIn('admin_note', admin_instance.fields)
        self.assertIn('status', admin_instance.list_editable)
        self.assertIn('message', admin_instance.readonly_fields)
