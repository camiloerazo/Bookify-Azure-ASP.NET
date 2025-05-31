using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using System.Globalization;

namespace Bookify.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly string _paypalClientId;
    private readonly string _paypalClientSecret;
    private readonly string _paypalBaseUrl;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<PaymentController> logger)
    {
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient("PayPal");
        _paypalClientId = _configuration["PayPal:ClientId"] ?? throw new ArgumentNullException("PayPal:ClientId");
        _paypalClientSecret = _configuration["PayPal:ClientSecret"] ?? throw new ArgumentNullException("PayPal:ClientSecret");
        _paypalBaseUrl = _configuration["PayPal:BaseUrl"] ?? "https://api-m.sandbox.paypal.com";
        _logger = logger;
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest orderRequest)
    {
        try
        {
            _logger.LogInformation("Creating PayPal order for amount: {Amount}, reservation: {ReservationId}", orderRequest.Amount, orderRequest.ReservationId);
            
            // Get PayPal access token
            var token = await GetPayPalAccessToken();
            _logger.LogInformation("Successfully obtained PayPal access token");
            
            // Create PayPal order
            var order = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        amount = new
                        {
                            currency_code = "USD",
                            value = orderRequest.Amount.ToString("0.00", CultureInfo.InvariantCulture)
                        },
                        description = $"Payment for reservation #{orderRequest.ReservationId}"
                    }
                }
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_paypalBaseUrl}/v2/checkout/orders");
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            httpRequest.Content = new StringContent(JsonSerializer.Serialize(order), Encoding.UTF8, "application/json");

            _logger.LogInformation("Sending order creation request to PayPal");
            var response = await _httpClient.SendAsync(httpRequest);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("PayPal order creation failed. Status: {Status}, Response: {Response}", 
                    response.StatusCode, responseContent);
                return BadRequest(responseContent);
            }

            _logger.LogInformation("PayPal order created successfully");
            var orderResponse = JsonSerializer.Deserialize<PayPalOrderResponse>(responseContent);
            return Ok(orderResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating PayPal order");
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("capture-order")]
    public async Task<IActionResult> CaptureOrder([FromBody] CaptureOrderRequest captureRequest)
    {
        try
        {
            var token = await GetPayPalAccessToken();
            
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_paypalBaseUrl}/v2/checkout/orders/{captureRequest.OrderId}/capture");
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(httpRequest);

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(await response.Content.ReadAsStringAsync());
            }

            var captureResponse = await response.Content.ReadFromJsonAsync<PayPalCaptureResponse>();
            return Ok(captureResponse);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    private async Task<string> GetPayPalAccessToken()
    {
        try
        {
            _logger.LogInformation("Getting PayPal access token");
            _logger.LogInformation("Using PayPal credentials - ClientId: {ClientId}, BaseUrl: {BaseUrl}", 
                _paypalClientId.Substring(0, 10) + "...", _paypalBaseUrl);
            
            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_paypalClientId}:{_paypalClientSecret}"));
            
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_paypalBaseUrl}/v1/oauth2/token");
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);
            httpRequest.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            _logger.LogInformation("Sending token request to PayPal");
            var response = await _httpClient.SendAsync(httpRequest);
            var responseContent = await response.Content.ReadAsStringAsync();
            
            _logger.LogInformation("PayPal token response status: {Status}", response.StatusCode);
            _logger.LogInformation("PayPal token response content: {Content}", responseContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to get PayPal access token. Status: {Status}, Response: {Response}", 
                    response.StatusCode, responseContent);
                throw new Exception($"Failed to get PayPal access token: {responseContent}");
            }

            try
            {
                var tokenResponse = JsonSerializer.Deserialize<PayPalTokenResponse>(responseContent);
                if (string.IsNullOrEmpty(tokenResponse?.AccessToken))
                {
                    _logger.LogError("PayPal token response did not contain access token. Full response: {Response}", responseContent);
                    throw new Exception($"PayPal token response did not contain access token. Response: {responseContent}");
                }

                _logger.LogInformation("Successfully obtained PayPal access token");
                return tokenResponse.AccessToken;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse PayPal token response. Response content: {Content}", responseContent);
                throw new Exception($"Failed to parse PayPal token response: {ex.Message}. Response: {responseContent}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting PayPal access token");
            throw;
        }
    }
}

public class CreateOrderRequest
{
    public decimal Amount { get; set; }
    public int ReservationId { get; set; }
}

public class CaptureOrderRequest
{
    public string OrderId { get; set; } = string.Empty;
}

public class PayPalTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;
}

public class PayPalOrderResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    [JsonPropertyName("links")]
    public List<PayPalLink> Links { get; set; } = new();
}

public class PayPalCaptureResponse
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class PayPalLink
{
    public string Href { get; set; } = string.Empty;
    public string Rel { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
} 