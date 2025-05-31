using Microsoft.EntityFrameworkCore;
using Bookify.Server.Data;  
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("BookifyDB");

// Validate PayPal configuration
var paypalClientId = builder.Configuration["PayPal:ClientId"];
var paypalClientSecret = builder.Configuration["PayPal:ClientSecret"];
var paypalBaseUrl = builder.Configuration["PayPal:BaseUrl"];

if (string.IsNullOrEmpty(paypalClientId) || string.IsNullOrEmpty(paypalClientSecret))
{
    throw new InvalidOperationException("PayPal credentials are not properly configured in appsettings.json");
}

builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhostReact", policy =>
    {
        policy.WithOrigins(
            "https://localhost:57182",  // Development port
            "https://localhost:5173",   // Vite default port
            "https://localhost:3000",   // Create React App default port
            "https://localhost:7035"    // ASP.NET Core default port
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Configure JSON serialization to handle circular references
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Use PascalCase
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<BookifyDbContext>(options =>
    options.UseSqlServer(connectionString));    

// Add HttpClient for PayPal
builder.Services.AddHttpClient("PayPal", client =>
{
    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
});

var app = builder.Build();

app.UseCors("AllowLocalhostReact");

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
