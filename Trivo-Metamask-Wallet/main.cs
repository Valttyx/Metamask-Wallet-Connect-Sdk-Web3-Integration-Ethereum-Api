using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json.Linq;

namespace MetaMask
{
    class Program
    {
        static void Main(string[] args)
        {
            string archivoVault = @"vault.json"; // ruta del archivo
            string password = "LaContraseña"; // Coloca aquí la contraseña de tu archivo de vault
            string datosVault = File.ReadAllText(archivoVault);
            JObject objetoVault = JObject.Parse(datosVault);
            byte[] datosCifrados = Convert.FromBase64String(objetoVault["data"]["data"].ToString());
            byte[] salt = Convert.FromBase64String(objetoVault["data"]["salt"].ToString());
            byte[] iv = Convert.FromBase64String(objetoVault["data"]["iv"].ToString());
            byte[] passwordKey = new Rfc2898DeriveBytes(password, salt, 10000).GetBytes(32);
            using (Aes aes = Aes.Create())
            {
                aes.Key = passwordKey;
                aes.IV = iv;
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
                    {
                        cs.Write(datosCifrados, 0, datosCifrados.Length);
                        cs.Close();
                    }
                    string datosDescifrados = Encoding.UTF8.GetString(ms.ToArray());
                    JObject objetoDescifrado = JObject.Parse(datosDescifrados);
                    JArray palabrasClave = (JArray)objetoDescifrado["data"]["secret_seed"];
                    Console.WriteLine("Las palabras clave son:");
                    foreach (string palabra in palabrasClave)
                    {
                        Console.WriteLine(palabra);
                    }
                }
            }
        }
    }
}
