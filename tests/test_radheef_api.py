import unittest

from fastapi import HTTPException

from api.main import definition, health, validate_word


class RadheefApiTests(unittest.TestCase):
    def test_health_and_exact_lookup(self):
        self.assertTrue(health()["ok"])
        result = definition("ކާކު")
        self.assertEqual(result["word"], "ކާކު")
        self.assertTrue(result["definitions"])

    def test_non_thaana_is_rejected(self):
        with self.assertRaises(HTTPException) as raised:
            validate_word("test")
        self.assertEqual(raised.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
