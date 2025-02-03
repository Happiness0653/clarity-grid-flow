;; GridFlow Energy Distribution Contract

;; Define energy credits token
(define-fungible-token energy-credit)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-already-registered (err u101))
(define-constant err-not-registered (err u102))
(define-constant err-insufficient-credits (err u103))

;; Data Maps
(define-map producers principal 
  {
    active: bool,
    total-generated: uint,
    region: (string-ascii 32)
  }
)

(define-map consumers principal
  {
    active: bool,
    total-consumed: uint,
    region: (string-ascii 32)
  }
)

;; Producer Registration
(define-public (register-producer (region (string-ascii 32)))
  (let ((producer-data {active: true, total-generated: u0, region: region}))
    (if (is-none (map-get? producers tx-sender))
      (begin
        (map-set producers tx-sender producer-data)
        (ok true))
      err-already-registered)))

;; Consumer Registration  
(define-public (register-consumer (region (string-ascii 32)))
  (let ((consumer-data {active: true, total-consumed: u0, region: region}))
    (if (is-none (map-get? consumers tx-sender))
      (begin 
        (map-set consumers tx-sender consumer-data)
        (ok true))
      err-already-registered)))

;; Record Energy Generation
(define-public (record-generation (amount uint))
  (let ((producer (map-get? producers tx-sender)))
    (if (is-some producer)
      (begin
        (map-set producers tx-sender 
          (merge (unwrap-panic producer)
            {total-generated: (+ (get total-generated (unwrap-panic producer)) amount)}))
        (try! (ft-mint? energy-credit amount tx-sender))
        (ok true))
      err-not-registered)))

;; Record Energy Consumption
(define-public (record-consumption (amount uint))
  (let ((consumer (map-get? consumers tx-sender)))
    (if (is-some consumer) 
      (begin
        (map-set consumers tx-sender
          (merge (unwrap-panic consumer)
            {total-consumed: (+ (get total-consumed (unwrap-panic consumer)) amount)}))
        (try! (ft-burn? energy-credit amount tx-sender))
        (ok true))
      err-not-registered)))

;; Transfer Energy Credits
(define-public (transfer-credits (amount uint) (recipient principal))
  (ft-transfer? energy-credit amount tx-sender recipient))

;; Read-only Functions
(define-read-only (get-producer-info (producer principal))
  (ok (map-get? producers producer)))

(define-read-only (get-consumer-info (consumer principal))
  (ok (map-get? consumers consumer)))

(define-read-only (get-credit-balance (account principal))
  (ok (ft-get-balance energy-credit account)))
