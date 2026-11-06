import os
import httpx
import phonenumbers
from phonenumbers.phonenumberutil import region_code_for_country_code
from typing import Optional, Dict, Any
from app.core.config import settings

class TruecallerProvider:
    """
    Truecaller Reverse Lookup & Authentication Provider
    Uses Truecaller's Gateway endpoints for caller identity, photo, carrier, and spam reputation.
    """
    SEARCH_ENDPOINT = "https://search5-noneu.truecaller.com/v2/search"
    SEND_OTP_ENDPOINT = "https://account-asia-south1.truecaller.com/v2/sendOnboardingOtp"
    VERIFY_OTP_ENDPOINT = "https://account-asia-south1.truecaller.com/v1/verifyOnboardingOtp"
    
    CLIENT_HEADERS = {
        "content-type": "application/json; charset=UTF-8",
        "accept-encoding": "gzip",
        "user-agent": "Truecaller/11.75.5 (Android;10)",
        "clientsecret": "lvc22mp3l1sfv6ujg83rd17btt",
    }

    @staticmethod
    async def send_otp(phone_number: str, country_code: str = "IN") -> Dict[str, Any]:
        """Request Truecaller SMS OTP for authentication"""
        try:
            pn = phonenumbers.parse(phone_number, country_code)
            if not phonenumbers.is_valid_number(pn):
                return {"status": "error", "message": "Invalid phone number format."}

            cc = str(region_code_for_country_code(pn.country_code))
            data = {
                "countryCode": cc,
                "dialingCode": pn.country_code,
                "phoneNumber": str(pn.national_number),
                "region": "region-2",
                "sequenceNo": 2,
                "installationDetails": {
                    "app": {
                        "buildVersion": 5,
                        "majorVersion": 11,
                        "minorVersion": 7,
                        "store": "GOOGLE_PLAY",
                    },
                    "device": {
                        "deviceId": "c1f7a8b9e0d1c2b3",
                        "language": "en",
                        "manufacturer": "Samsung",
                        "model": "SM-G975F",
                        "osName": "Android",
                        "osVersion": "10",
                        "mobileServices": ["GMS"],
                    },
                    "language": "en",
                },
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    TruecallerProvider.SEND_OTP_ENDPOINT,
                    json=data,
                    headers=TruecallerProvider.CLIENT_HEADERS
                )

            if res.status_code == 200:
                body = res.json()
                return {
                    "status": "success",
                    "request_id": body.get("requestId"),
                    "message": "Truecaller OTP sent to phone number via SMS."
                }
            else:
                return {
                    "status": "error",
                    "status_code": res.status_code,
                    "message": res.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def verify_otp(phone_number: str, request_id: str, otp: str, country_code: str = "IN") -> Dict[str, Any]:
        """Verify OTP and return installationId token"""
        try:
            pn = phonenumbers.parse(phone_number, country_code)
            cc = str(region_code_for_country_code(pn.country_code))
            post_data = {
                "countryCode": cc,
                "dialingCode": pn.country_code,
                "phoneNumber": str(pn.national_number),
                "requestId": request_id,
                "token": otp.strip(),
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    TruecallerProvider.VERIFY_OTP_ENDPOINT,
                    json=post_data,
                    headers=TruecallerProvider.CLIENT_HEADERS
                )

            if res.status_code == 200:
                body = res.json()
                return {
                    "status": "success",
                    "installation_id": body.get("installationId"),
                    "user_id": body.get("userId"),
                    "message": "Truecaller authentication successful."
                }
            else:
                return {
                    "status": "error",
                    "status_code": res.status_code,
                    "message": res.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @staticmethod
    async def search(phone_number: str, country_code: str = "IN", installation_id: Optional[str] = None) -> Dict[str, Any]:
        """Search Truecaller for caller identity, photo, carrier, and spam data"""
        token = installation_id or getattr(settings, "TRUECALLER_INSTALLATION_ID", None) or os.getenv("TRUECALLER_INSTALLATION_ID")
        if not token:
            return {
                "status": "unauthenticated",
                "message": "No Truecaller installationId token provided. Connect Truecaller account or paste installationId."
            }

        try:
            pn = phonenumbers.parse(phone_number, country_code)
            significant_number = str(pn.national_number)
            dialing_code = pn.country_code

            headers = {
                "content-type": "application/json; charset=UTF-8",
                "accept-encoding": "gzip",
                "user-agent": "Truecaller/11.75.5 (Android;10)",
                "Authorization": f"Bearer {token}"
            }
            params = {
                "q": significant_number,
                "countryCode": str(dialing_code),
                "type": 4,
                "locAddr": "",
                "placement": "SEARCHRESULTS,HISTORY,DETAILS",
                "encoding": "json"
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(
                    TruecallerProvider.SEARCH_ENDPOINT,
                    params=params,
                    headers=headers
                )

            if res.status_code == 200:
                raw_json = res.json()
                records = raw_json.get("data", [])
                if not records:
                    return {
                        "status": "not_found",
                        "message": "Number not found in Truecaller database."
                    }

                primary = records[0]
                phones = primary.get("phones", [{}])
                carrier = phones[0].get("carrier") if phones else None
                phone_type = phones[0].get("numberType") if phones else None
                
                addresses = primary.get("addresses", [{}])
                city = addresses[0].get("city") if addresses else None
                country_res = addresses[0].get("countryCode") if addresses else None

                emails = [e.get("id") for e in primary.get("internetAddresses", []) if e.get("id")]
                email = emails[0] if emails else None

                name = primary.get("name")
                image_url = primary.get("image")
                badges = primary.get("badges", [])
                spam_score = primary.get("spamScore", 0)
                spam_type = primary.get("spamType")
                is_business = "business" in badges or primary.get("isBusiness", False)

                return {
                    "status": "success",
                    "found": True,
                    "name": name,
                    "carrier": carrier,
                    "phone_type": phone_type,
                    "image_url": image_url,
                    "city": city,
                    "country": country_res,
                    "email": email,
                    "badges": badges,
                    "spam_score": spam_score,
                    "spam_type": spam_type,
                    "is_business": is_business,
                    "raw": primary
                }
            elif res.status_code == 401:
                return {
                    "status": "unauthorized",
                    "message": "Truecaller installation token expired or invalid. Please re-authenticate."
                }
            elif res.status_code == 429:
                return {
                    "status": "rate_limited",
                    "message": "Truecaller API rate limit reached. Please wait or rotate token."
                }
            else:
                return {
                    "status": "error",
                    "status_code": res.status_code,
                    "message": res.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}

truecaller_provider = TruecallerProvider()
