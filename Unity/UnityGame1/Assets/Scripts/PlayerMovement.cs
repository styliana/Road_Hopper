using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerMovement : MonoBehaviour
{
    [Header("Parametry ruchu i skoku (Ocena 5.0)")]
    [SerializeField] private float speed = 7f;
    [SerializeField] private float jumpForce = 12f;

    [Header("Stan podłoża (Podgląd w Inspektorze)")]
    [SerializeField] private bool isGrounded = false;

    private Rigidbody2D rb;
    private SpriteRenderer spriteRenderer;
    private Collider2D col;
    private Animator animator;

    private float horizontalInput = 0f;
    private bool jumpRequested = false;
    private float lastJumpTime = 0f;
    private const float JumpCooldown = 0.2f;

    private bool isTouchingGround = false;
    private readonly RaycastHit2D[] castHits = new RaycastHit2D[10];

    private static readonly int IsGroundedParameter = Animator.StringToHash("isGrounded");

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        spriteRenderer = GetComponent<SpriteRenderer>();
        col = GetComponent<Collider2D>();
        animator = GetComponent<Animator>();
    }

    void Start()
    {
        if (speed <= 0.1f) speed = 7f;
        if (jumpForce <= 0.1f) jumpForce = 12f;
    }

    void Update()
    {
        if (Keyboard.current == null) return;

        // 1. Sterowanie w lewo / prawo
        horizontalInput = 0f;
        if (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed)
        {
            horizontalInput -= 1f;
        }
        if (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed)
        {
            horizontalInput += 1f;
        }

        // 2. Obrót postaci w stronę ruchu (flip)
        if (spriteRenderer != null)
        {
            if (horizontalInput > 0.01f)
            {
                spriteRenderer.flipX = false;
            }
            else if (horizontalInput < -0.01f)
            {
                spriteRenderer.flipX = true;
            }
        }

        // 3. Sprawdzanie czy postać stoi na podłożu
        if (Time.time - lastJumpTime > JumpCooldown)
        {
            isGrounded = CheckIfGrounded();
        }
        else
        {
            isGrounded = false;
        }

        // Przekazanie stanu podłoża do Animatora
        if (animator != null)
        {
            animator.SetBool(IsGroundedParameter, isGrounded);
        }

        // 4. Skok (Spacja, W lub strzałka w górę)
        bool jumpPressed = Keyboard.current.spaceKey.wasPressedThisFrame ||
                           Keyboard.current.wKey.wasPressedThisFrame ||
                           Keyboard.current.upArrowKey.wasPressedThisFrame;

        if (jumpPressed)
        {
            if (isGrounded)
            {
                jumpRequested = true;
                isGrounded = false;
                isTouchingGround = false;
                lastJumpTime = Time.time;

                if (animator != null)
                {
                    animator.SetBool(IsGroundedParameter, false);
                }

                Debug.Log("<color=green>[PlayerMovement] SKOK! (isGrounded = True)</color>");
            }
            else
            {
                Debug.LogWarning("[PlayerMovement] Skok zablokowany: postać jest w powietrzu! (isGrounded = False). Upewnij się, że trawa ma BoxCollider2D, a postać ma Collider2D.");
            }
        }

        // Zabezpieczenie na brak Rigidbody2D
        if (rb == null)
        {
            transform.Translate(Vector3.right * horizontalInput * speed * Time.deltaTime);
        }
    }

    void FixedUpdate()
    {
        if (rb == null) return;

        // Ruch poziomy
#if UNITY_6000_0_OR_NEWER
        rb.linearVelocity = new Vector2(horizontalInput * speed, rb.linearVelocity.y);
#else
        rb.velocity = new Vector2(horizontalInput * speed, rb.velocity.y);
#endif

        // Nadanie prędkości skoku
        if (jumpRequested)
        {
#if UNITY_6000_0_OR_NEWER
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
#else
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
#endif
            jumpRequested = false;
        }
    }

    // Niezawodne sprawdzanie podłoża
    private bool CheckIfGrounded()
    {
        // A) Jeśli silnik fizyki zarejestrował bezpośredni kontakt stóp z podłożem
        if (isTouchingGround) return true;

        if (col == null)
        {
            col = GetComponent<Collider2D>();
            // Jeśli obiekt postaci nie ma jeszcze collidera, nie blokujemy gracza
            if (col == null) return true;
        }

        // B) Wykorzystanie col.Cast - rzutuje kształt postaci 0.15f w dół, ignorując samą siebie
        int hitCount = col.Cast(Vector2.down, castHits, 0.15f);
        for (int i = 0; i < hitCount; i++)
        {
            if (castHits[i].collider != null && !castHits[i].collider.isTrigger)
            {
                return true;
            }
        }

        // C) Dodatkowy zapasowy test za pomocą BoxCastAll pod stopy
        Vector2 feet = new Vector2(col.bounds.center.x, col.bounds.min.y);
        RaycastHit2D[] allHits = Physics2D.BoxCastAll(feet, new Vector2(col.bounds.size.x * 0.85f, 0.05f), 0f, Vector2.down, 0.15f);
        foreach (var h in allHits)
        {
            if (h.collider != null && h.collider != col && !h.collider.isTrigger)
            {
                return true;
            }
        }

        return false;
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        CheckCollision(collision);
    }

    private void OnCollisionStay2D(Collision2D collision)
    {
        CheckCollision(collision);
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        isTouchingGround = false;
    }

    private void CheckCollision(Collision2D collision)
    {
        if (Time.time - lastJumpTime < JumpCooldown) return;

        for (int i = 0; i < collision.contactCount; i++)
        {
            // Jeśli normalna wskazuje w górę, kontakt jest pod postacią
            if (collision.GetContact(i).normal.y > 0.4f)
            {
                isTouchingGround = true;
                isGrounded = true;
                return;
            }
        }
    }

    private void OnDrawGizmosSelected()
    {
        if (col == null) col = GetComponent<Collider2D>();
        if (col != null)
        {
            Gizmos.color = isGrounded ? Color.green : Color.red;
            Vector2 feet = new Vector2(col.bounds.center.x, col.bounds.min.y);
            Gizmos.DrawWireCube(feet + Vector2.down * 0.07f, new Vector2(col.bounds.size.x * 0.85f, 0.14f));
        }
    }
}