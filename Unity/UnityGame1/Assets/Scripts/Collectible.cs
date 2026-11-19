using UnityEngine;

public class Collectible : MonoBehaviour
{
    [SerializeField] private int points = 1;
    [SerializeField] private bool randomPenalty;
    [SerializeField] private float bobHeight = 0.12f;
    [SerializeField] private float bobSpeed = 2f;
    [SerializeField] private float rotationSpeed = 90f;
    [SerializeField] private float destroyDelay = 0.35f;

    private ScoreManager scoreManager;
    private Animator animator;
    private Collider2D col;
    private Vector3 startPosition;
    private float phase;
    private bool collected;

    private static readonly int CollectedTrigger = Animator.StringToHash("collected");

    private void Awake()
    {
        scoreManager = FindAnyObjectByType<ScoreManager>();
        animator = GetComponent<Animator>();
        col = GetComponent<Collider2D>();

        if (scoreManager == null)
        {
            Debug.LogError("Collectible wymaga obiektu ze skryptem ScoreManager.", this);
        }

        startPosition = transform.position;
        phase = Random.Range(0f, Mathf.PI * 2f);
    }

    private void Update()
    {
        if (collected) return;

        Vector3 position = startPosition;
        position.y += Mathf.Sin(Time.time * bobSpeed + phase) * bobHeight;
        transform.position = position;
        transform.Rotate(0f, 0f, rotationSpeed * Time.deltaTime);
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (collected || !other.CompareTag("Player"))
        {
            return;
        }

        collected = true;

        if (col != null)
        {
            col.enabled = false;
        }

        if (scoreManager != null)
        {
            int awardedPoints = randomPenalty ? -Random.Range(1, 4) : points;
            scoreManager.AddPoints(awardedPoints);
        }

        if (animator != null)
        {
            transform.rotation = Quaternion.identity;
            animator.SetTrigger(CollectedTrigger);
            Destroy(gameObject, destroyDelay);
        }
        else
        {
            Destroy(gameObject);
        }
    }
}